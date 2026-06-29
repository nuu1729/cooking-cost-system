import { useDrag, useDrop } from 'react-dnd';
import { useCallback, useRef, useState } from 'react';
import { DragItem, Ingredient, Dish, CompletedFood } from '../types';

// ドラッグ&ドロップの種類定義
export const DragTypes = {
  INGREDIENT: 'ingredient',
  DISH: 'dish',
  COMPLETED_FOOD: 'completedFood',
} as const;

// ドラッグ可能なアイテムのフック
export const useDraggableItem = <T extends Ingredient | Dish | CompletedFood>(
  item: T,
  type: string
) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type,
    item: {
      type,
      item,
      id: item.id,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return {
    isDragging,
    drag,
    preview,
  };
};

// ドロップターゲットのフック
export const useDropTarget = (
  accept: string | string[],
  onDrop: (item: DragItem, monitor: any) => void,
  canDrop?: (item: DragItem, monitor: any) => boolean
) => {
  const [{ isOver, canDropItem }, drop] = useDrop({
    accept,
    drop: onDrop,
    canDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDropItem: monitor.canDrop(),
    }),
  });

  return {
    isOver,
    canDrop: canDropItem,
    drop,
  };
};

// 食材を料理にドロップするフック
export const useIngredientToDish = (
  onAddIngredient: (ingredient: Ingredient, quantity: number) => void
) => {
  const [quantityInput, setQuantityInput] = useState<{
    ingredient: Ingredient | null;
    isOpen: boolean;
  }>({ ingredient: null, isOpen: false });

  const handleDrop = useCallback((item: DragItem) => {
    if (item.type === DragTypes.INGREDIENT) {
      setQuantityInput({
        ingredient: item.item as Ingredient,
        isOpen: true,
      });
    }
  }, []);

  const handleQuantitySubmit = useCallback((quantity: number) => {
    if (quantityInput.ingredient) {
      onAddIngredient(quantityInput.ingredient, quantity);
      setQuantityInput({ ingredient: null, isOpen: false });
    }
  }, [quantityInput.ingredient, onAddIngredient]);

  const handleQuantityCancel = useCallback(() => {
    setQuantityInput({ ingredient: null, isOpen: false });
  }, []);

  const dropTarget = useDropTarget(
    DragTypes.INGREDIENT,
    handleDrop,
    (item) => item.type === DragTypes.INGREDIENT
  );

  return {
    ...dropTarget,
    quantityInput,
    handleQuantitySubmit,
    handleQuantityCancel,
  };
};

// 料理を完成品にドロップするフック
export const useDishToCompletedFood = (
  onAddDish: (dish: Dish, quantity: number, unit: 'ratio' | 'serving') => void
) => {
  const [dishInput, setDishInput] = useState<{
    dish: Dish | null;
    isOpen: boolean;
  }>({ dish: null, isOpen: false });

  const handleDrop = useCallback((item: DragItem) => {
    if (item.type === DragTypes.DISH) {
      setDishInput({
        dish: item.item as Dish,
        isOpen: true,
      });
    }
  }, []);

  const handleDishSubmit = useCallback((
    quantity: number, 
    unit: 'ratio' | 'serving'
  ) => {
    if (dishInput.dish) {
      onAddDish(dishInput.dish, quantity, unit);
      setDishInput({ dish: null, isOpen: false });
    }
  }, [dishInput.dish, onAddDish]);

  const handleDishCancel = useCallback(() => {
    setDishInput({ dish: null, isOpen: false });
  }, []);

  const dropTarget = useDropTarget(
    DragTypes.DISH,
    handleDrop,
    (item) => item.type === DragTypes.DISH
  );

  return {
    ...dropTarget,
    dishInput,
    handleDishSubmit,
    handleDishCancel,
  };
};

// ソート可能なリストのフック
export const useSortableList = <T extends { id: number }>(
  items: T[],
  onReorder: (newItems: T[]) => void
) => {
  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    const newItems = [...items];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    onReorder(newItems);
  }, [items, onReorder]);

  return { moveItem };
};

// ソート可能なアイテムのフック
export const useSortableItem = <T extends { id: number }>(
  item: T,
  index: number,
  moveItem: (dragIndex: number, hoverIndex: number) => void
) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'sortable-item',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(draggedItem: any, monitor) {
      if (!ref.current) return;

      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'sortable-item',
    item: () => ({ id: item.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return {
    ref,
    isDragging,
    handlerId,
  };
};

// マルチ選択ドラッグのフック
export const useMultiSelectDrag = <T extends { id: number }>(
  selectedItems: T[],
  onDrop: (items: T[], target: any) => void
) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'multi-select',
    item: { items: selectedItems },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: selectedItems.length > 0,
  });

  const dropTarget = useDropTarget('multi-select', (item: any) => {
    onDrop(item.items, item);
  });

  return {
    isDragging,
    drag,
    ...dropTarget,
  };
};

// ドラッグプレビューカスタマイズのフック
export const useDragPreview = (item: any, _type: string) => {
  const preview = useCallback((connect: any) => {
    const element = document.createElement('div');
    element.className = 'drag-preview';
    element.innerHTML = `
      <div style="
        background: white;
        border: 2px solid #1976d2;
        border-radius: 8px;
        padding: 8px 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        font-weight: 500;
        max-width: 200px;
        z-index: 1000;
      ">
        📋 ${item.name || 'アイテム'}
      </div>
    `;
    connect(element);
    return element;
  }, [item]);

  return preview;
};

// ドロップゾーンのバリデーション
export const validateDrop = (
  draggedItem: DragItem,
  targetType: string,
  existingItems: any[] = []
): { canDrop: boolean; reason?: string } => {
  // 同じアイテムが既に存在するかチェック
  const isDuplicate = existingItems.some(
    existing => existing.id === draggedItem.item.id
  );

  if (isDuplicate) {
    return {
      canDrop: false,
      reason: 'このアイテムは既に追加されています',
    };
  }

  // タイプの適合性をチェック
  const typeCompatibility: Record<string, string[]> = {
    'dish-builder': [DragTypes.INGREDIENT],
    'food-builder': [DragTypes.DISH],
    'floating-area': [DragTypes.INGREDIENT, DragTypes.DISH, DragTypes.COMPLETED_FOOD],
  };

  const acceptedTypes = typeCompatibility[targetType] || [];
  
  if (!acceptedTypes.includes(draggedItem.type)) {
    return {
      canDrop: false,
      reason: 'このエリアには対応していないアイテムです',
    };
  }

  return { canDrop: true };
};

export default {
  useDraggableItem,
  useDropTarget,
  useIngredientToDish,
  useDishToCompletedFood,
  useSortableList,
  useSortableItem,
  useMultiSelectDrag,
  useDragPreview,
  validateDrop,
};
