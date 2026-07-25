// Script para debug do carrinho
export const debugCart = () => {
  // Limpar localStorage do carrinho
  localStorage.removeItem('kumekume-cart');
  console.log('Carrinho limpo!');
  
  // Recarregar a página
  window.location.reload();
};

// Função para limpar carrinho sem recarregar
export const clearCartOnly = () => {
  localStorage.removeItem('kumekume-cart');
  console.log('Carrinho limpo! (sem recarregar)');
};

// Função para verificar o estado atual do carrinho
export const checkCartState = () => {
  const cartData = localStorage.getItem('kumekume-cart');
  if (cartData) {
    const cart = JSON.parse(cartData);
    console.log('Estado atual do carrinho:', cart);
    return cart;
  } else {
    console.log('Carrinho vazio');
    return null;
  }
}; 