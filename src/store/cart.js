import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] 
  }),
  actions: {
    setItems(items) {
      this.items = items;
    },
    clearCart() {
      this.items = [];
    }
  }
});