import { Ingredient } from '../../types';
import loginAccounts from '../data/login_accounts.json';
import initialIngredients from '../data/ingredients.json';
import initialPreps from '../data/preps.json';
import initialDishes from '../data/dishes.json';

// In-Memory DB
export let MOCK_ACCOUNTS = [...loginAccounts];
export let MOCK_INGREDIENTS: Ingredient[] = [...initialIngredients] as Ingredient[];
export let MOCK_PREPS: any[] = [...initialPreps];
export let MOCK_DISHES: any[] = [...initialDishes];
