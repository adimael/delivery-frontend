import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  customizations?: {
    mainOptions?: { id: string, name: string }[];
    meatOptions?: { id: string, name: string }[];
    extraOptions?: { id: string, name: string, price: number }[];
    silverware?: boolean;
    notes?: string;
    variations?: Record<string, { id: string, nome: string, preco_adicional?: number }>;
    selections?: Array<{
      id: string;
      opcao_uuid: string;
      nome: string;
      quantidade: number;
      preco_adicional: number;
      categoria: string;
      produto_adicional_uuid?: string | null;
    }>;
  };
  totalPrice?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item: CartItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(i => 
          i.id === item.id && 
          JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
        );
        
        if (existingItem) {
          // If item already exists with same customizations, update quantity and total price
          const newQuantity = existingItem.quantity + item.quantity;
          
          // Use the existing totalPrice calculation method or calculate from scratch
          let newTotalPrice;
          if (existingItem.totalPrice !== undefined && existingItem.totalPrice !== null) {
            const pricePerUnit = existingItem.totalPrice / existingItem.quantity;
            newTotalPrice = pricePerUnit * newQuantity;
          } else {
            // Recalculate from base price and customizations
            let pricePerUnit = existingItem.price;
            
            // Add extra options prices if they exist
            if (existingItem.customizations?.extraOptions) {
              const extraOptionsTotal = existingItem.customizations.extraOptions.reduce(
                (sum, option) => sum + (option.price || 0), 
                0
              );
              pricePerUnit += extraOptionsTotal;
            }
            if (existingItem.customizations?.selections) {
              pricePerUnit += existingItem.customizations.selections.reduce(
                (sum, option) => sum + option.preco_adicional * option.quantidade,
                0
              );
            }
            
            // Add variations prices if they exist
            if (existingItem.customizations?.variations) {
              const variationsTotal = Object.values(existingItem.customizations.variations).reduce(
                (sum, variation) => sum + (variation.preco_adicional || 0), 
                0
              );
              pricePerUnit += variationsTotal;
            }
            
            newTotalPrice = pricePerUnit * newQuantity;
          }
          
          set({
            items: currentItems.map(i => 
              i.id === existingItem.id && 
              JSON.stringify(i.customizations) === JSON.stringify(existingItem.customizations)
                ? { 
                    ...i, 
                    quantity: newQuantity,
                    totalPrice: newTotalPrice
                  }
                : i
            )
          });
        } else {
          // Add new item to cart
          set({ items: [...currentItems, item] });
        }
      },
      
      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity < 1) {
          // Remove item if quantity is less than 1
          set({
            items: get().items.filter(item => item.id !== itemId)
          });
          return;
        }
        
        set({
          items: get().items.map(item => {
            if (item.id === itemId) {
              // Calculate the price per unit (including customizations)
              let pricePerUnit = item.price;
              
              // Add extra options prices if they exist
              if (item.customizations?.extraOptions) {
                const extraOptionsTotal = item.customizations.extraOptions.reduce(
                  (sum, option) => sum + (option.price || 0), 
                  0
                );
                pricePerUnit += extraOptionsTotal;
              }
              if (item.customizations?.selections) {
                pricePerUnit += item.customizations.selections.reduce(
                  (sum, option) => sum + option.preco_adicional * option.quantidade,
                  0
                );
              }
              
              // Add variations prices if they exist
              if (item.customizations?.variations) {
                const variationsTotal = Object.values(item.customizations.variations).reduce(
                  (sum, variation) => sum + (variation.preco_adicional || 0), 
                  0
                );
                pricePerUnit += variationsTotal;
              }
              
              // Calculate new total price
              const newTotalPrice = pricePerUnit * quantity;
              
              return { 
                ...item, 
                quantity,
                totalPrice: newTotalPrice
              };
            }
            return item;
          })
        });
      },
      
      removeItem: (itemId: string) => {
        set({
          items: get().items.filter(item => item.id !== itemId)
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      }
    }),
    {
      name: 'kumekume-cart'
    }
  )
);
