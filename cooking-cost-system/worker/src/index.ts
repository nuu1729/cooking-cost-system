import { Container, getRandom } from "@cloudflare/containers";
import { env as workersEnv } from "cloudflare:workers";

// Flask + Gunicorn がコンテナ内で待ち受けるポート（backend/gunicorn.conf.py の PORT と一致させる）
const CONTAINER_PORT = 3001;

// 同時に立ち上げる最大インスタンス数。getRandom によるステートレス負荷分散を行う
// （JWT 認証はステートレスなため、コンテナ間のセッションアフィニティは不要）。
const INSTANCE_COUNT = 3;

// `wrangler types` が生成する Cloudflare.Env は環境ごとの vars を union 型でマージし、
// secrets（wrangler secret put で設定するもの）は一切含まない不完全な型になるため、
// このモジュール専用の Env 型を自前で定義し、実行時に必須項目の存在を検証する。
interface WorkerEnv {
  BACKEND_CONTAINER: DurableObjectNamespace<CookingCostBackend>;
  // 非機密変数（wrangler.toml [env.*.vars] で設定）
  APP_ENV: string;
  CF_ACCOUNT_ID: string;
  CF_D1_DATABASE_ID: string;
  CORS_ORIGIN: string;
  R2_BUCKET_NAME: string;
  // secrets（`wrangler secret put <NAME> --env <環境名>` で設定。詳細は issue #176 / Phase 4）
  CF_D1_API_TOKEN: string;
  JWT_SECRET: string;
  SECRET_KEY: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}

function requireVar(env: unknown, name: keyof WorkerEnv): string {
  const value = (env as Record<string, unknown>)[name as string];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`環境変数/secret '${String(name)}' が設定されていません`);
  }
  return value;
}

export class CookingCostBackend extends Container {
  defaultPort = CONTAINER_PORT;
  // 一定時間リクエストがなければコンテナを停止する（コスト最適化。コールドスタートとのトレードオフ）
  sleepAfter = "10m";

  // Worker の env（secrets 含む）をコンテナのプロセス環境変数として渡す。
  // config_production.py / config_staging.py は Docker secrets ファイルではなく
  // これらの環境変数を直接読む（Phase 1 で対応済み）。
  envVars: Record<string, string> = {
    APP_ENV: requireVar(workersEnv, "APP_ENV"),
    PORT: String(CONTAINER_PORT),
    CF_ACCOUNT_ID: requireVar(workersEnv, "CF_ACCOUNT_ID"),
    CF_D1_DATABASE_ID: requireVar(workersEnv, "CF_D1_DATABASE_ID"),
    CF_D1_API_TOKEN: requireVar(workersEnv, "CF_D1_API_TOKEN"),
    JWT_SECRET: requireVar(workersEnv, "JWT_SECRET"),
    SECRET_KEY: requireVar(workersEnv, "SECRET_KEY"),
    CORS_ORIGIN: requireVar(workersEnv, "CORS_ORIGIN"),
    R2_BUCKET_NAME: requireVar(workersEnv, "R2_BUCKET_NAME"),
    R2_ACCESS_KEY_ID: requireVar(workersEnv, "R2_ACCESS_KEY_ID"),
    R2_SECRET_ACCESS_KEY: requireVar(workersEnv, "R2_SECRET_ACCESS_KEY"),
  };

  override onStart() {
    console.log("cooking-cost-backend container started");
  }

  override onStop() {
    console.log("cooking-cost-backend container stopped");
  }

  override onError(error: unknown) {
    console.error("cooking-cost-backend container error:", error);
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // このWorkerはバックエンドAPI専用（フロントエンドは別途 Cloudflare Pages でホスト）。
    // 全リクエストをコンテナ（Flask/Gunicorn）にそのまま転送する。
    const instance = await getRandom(env.BACKEND_CONTAINER, INSTANCE_COUNT);
    return instance.fetch(request);
  },
};
