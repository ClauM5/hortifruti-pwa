// Arquivo: frontend/src/pages/AdminPage.jsx (Com WS_URL corrigido)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AdminPage.css';

// URLs da API
const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';
const WS_URL = 'wss://hortifruti-backend.onrender.com'; // <<--- ESTA LINHA ESTAVA FALTANDO

function AdminPage() {
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [senha, setSenha] = useState('102030');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formProduto, setFormProduto] = useState({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '', categorias: [] });
  const [imagemFile, setImagemFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formCategoria, setFormCategoria] = useState({ id: null, nome: '' });

  const notificationSound = useRef(null);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = { 'authorization': "102030" };
      const [produtosResponse, pedidosResponse, categoriasResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/produtos`),
        fetch(`${API_BASE_URL}/pedidos`, { headers }),
        fetch(`${API_BASE_URL}/categorias`)
      ]);

      if (!produtosResponse.ok || !pedidosResponse.ok || !categoriasResponse.ok) {
        throw new Error('Falha ao carregar dados do admin.');
      }
      
      const produtosData = await produtosResponse.json();
      const pedidosData = await pedidosResponse.json();
      const categoriasData = await categoriasResponse.json();

      setProdutos(produtosData);
      setPedidos(pedidosData);
      setCategorias(categoriasData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleStatusChange = useCallback(async (pedidoId, novoStatus) => { setError(''); try { const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'authorization': "102030" }, body: JSON.stringify({ status: novoStatus }) }); if (!response.ok) throw new Error('Falha ao atualizar status.'); setPedidos(prevPedidos => prevPedidos.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p)); } catch (err) { setError(err.message); } }, []);
  const handleImageUpload = async () => { if (!imagemFile) return null; setIsUploading(true); const formData = new FormData(); formData.append('image', imagemFile); try { const response = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', headers: { 'authorization': "102030" }, body: formData, }); if (!response.ok) throw new Error('Falha no upload da imagem.'); const data = await response.json(); return data.imageUrl; } catch (err) { setError(err.message); return null; } finally { setIsUploading(false); } };
  const handleSaveProduto = async (e) => { e.preventDefault(); setIsLoading(true); setError(''); let imageUrl = formProduto.imagem; if (imagemFile) { imageUrl = await handleImageUpload(); if (!imageUrl) { setIsLoading(false); return; } } const categoriaIds = formProduto.categorias.map(cat => cat.id); const produtoData = { ...formProduto, imagem: imageUrl, categorias: categoriaIds }; const { id, ...data } = produtoData; const method = id ? 'PUT' : 'POST'; const url = id ? `${API_BASE_URL}/produtos/${id}` : `${API_BASE_URL}/produtos`; try { const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'authorization': "102030" }, body: JSON.stringify(data) }); if (!response.ok) throw new Error(`Falha ao salvar produto.`); clearFormProduto(); fetchAdminData(); } catch (err) { setError(err.message); } finally { setIsLoading(false); } };
  const handleDelete = async (produtoId) => { if (!window.confirm("Tem certeza que deseja deletar este produto?")) return; setIsLoading(true); try { await fetch(`${API_BASE_URL}/produtos/${produtoId}`, { method: 'DELETE', headers: { 'authorization': "102030" } }); fetchAdminData(); } catch (err) { setError(err.message) } finally { setIsLoading(false) } };
  const handleSaveCategoria = async (e) => { e.preventDefault(); const { id, nome } = formCategoria; if (!nome) return; const method = id ? 'PUT' : 'POST'; const url = id ? `${API_BASE_URL}/categorias/${id}` : `${API_BASE_URL}/categorias`; try { await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'authorization': "102030" }, body: JSON.stringify({ nome }) }); setFormCategoria({ id: null, nome: '' }); fetchAdminData(); } catch (err) { setError('Falha ao salvar categoria.'); } };
  const handleDeleteCategoria = async (catId) => { if (!window.confirm("Certeza? Deletar uma categoria a removerá de todos os produtos.")) return; try { await fetch(`${API_BASE_URL}/categorias/${catId}`, { method: 'DELETE', headers: { 'authorization': "102030" } }); fetchAdminData(); } catch (err) { setError('Falha ao deletar categoria.'); } };

  const handleEditProduto = (produto) => { const categoriasDoProduto = categorias.filter(cat => produto.categorias?.includes(cat.nome)); setFormProduto({ ...produto, categorias: categoriasDoProduto }); setImagemFile(null); window.scrollTo(0, 0); };
  const clearFormProduto = () => { setFormProduto({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '', categorias: [] }); setImagemFile(null); };
  const handleFormChange = (e) => { const { name, value } = e.target; setFormProduto(p => ({ ...p, [name]: value })); };
  const handleFileChange = (e) => { setImagemFile(e.target.files[0]); };
  const handleCategoryChange = (categoria) => { setFormProduto(prevForm => { const CategoriaExiste = prevForm.categorias.find(cat => cat.id === categoria.id); if (CategoriaExiste) { return { ...prevForm, categorias: prevForm.categorias.filter(cat => cat.id !== categoria.id) }; } else { return { ...prevForm, categorias: [...prevForm.categorias, categoria] }; } }); };
  const handleLogin = () => { if (senha === "102030") setIsLoggedIn(true); else alert('Senha incorreta!'); };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAdminData();
    notificationSound.current = new Audio('/notification.mp3');
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => console.log('Conectado ao servidor WebSocket do admin.');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NOVO_PEDIDO') {
        notificationSound.current.play().catch(e => console.log(e));
        setPedidos(prev => [message.payload, ...prev]);
        document.title = ">> NOVO PEDIDO! <<";
        setTimeout(() => { document.title = "Painel de Admin"; }, 5000);
      }
    };
    ws.onclose = () => console.log('Desconectado do servidor WebSocket.');
    ws.onerror = (error) => console.error('Erro no WebSocket:', error);
    return () => ws.close();
  }, [isLoggedIn, fetchAdminData]);

  if (!isLoggedIn) { return ( <div className="admin-login-container"> <h2>Painel de Administrador</h2> <input type="password" placeholder="Digite a senha" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="admin-input"/> <button onClick={handleLogin} className="admin-button">Entrar</button> </div> ); }
  
  // O JSX de renderização continua o mesmo
  return (
    <div className="admin-container">
      <div className="admin-header"> <h2>Gerenciar Produtos e Pedidos</h2> <button onClick={() => setIsLoggedIn(false)} className="admin-button logout-button">Sair</button> </div>
      {error && <p className="error-message">{error}</p>}
      {isLoading && <p>Carregando...</p>}
      <div className="category-manager"> <h3>Gerenciar Categorias</h3> <form onSubmit={handleSaveCategoria} className="category-form"> <input type="text" placeholder="Nome da nova categoria" value={formCategoria.nome} onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })} /> <button type="submit" className="admin-button">Salvar Categoria</button> </form> <div className="category-list"> {categorias.map(cat => ( <div key={cat.id} className="category-item"> <span>{cat.nome}</span> <button onClick={() => handleDeleteCategoria(cat.id)} className="delete-button-small">X</button> </div> ))} </div> </div>
      <form onSubmit={handleSaveProduto} className="admin-form"> <h3>{formProduto.id ? 'Editando Produto' : 'Adicionar Novo Produto'}</h3> <input type="text" name="nome" placeholder="Nome do Produto" value={formProduto.nome} onChange={handleFormChange} required /> <input type="number" name="preco" placeholder="Preço (ex: 7.99)" value={formProduto.preco} onChange={handleFormChange} required step="0.01" /> <input type="text" name="unidade" placeholder="Unidade (kg, un, etc)" value={formProduto.unidade} onChange={handleFormChange} required /> <label htmlFor="imagem-upload">Imagem do Produto:</label> <input id="imagem-upload" type="file" name="imagem" onChange={handleFileChange} accept="image/*" />
        <div className="category-checkboxes"> <label>Categorias:</label> {categorias.map(cat => ( <label key={cat.id}> <input type="checkbox" checked={formProduto.categorias.some(formCat => formCat.id === cat.id)} onChange={() => handleCategoryChange(cat)} /> {cat.nome} </label> ))} </div>
        <div className="form-buttons"> <button type="submit" className="admin-button save-button" disabled={isUploading}> {isUploading ? 'Enviando...' : 'Salvar'} </button> {formProduto.id && <button type="button" onClick={clearFormProduto} className="admin-button clear-button">Cancelar Edição</button>} </div>
      </form>
      <div className="product-list"> {produtos.map(p => ( <div key={p.id} className="product-item"> <img src={p.imagem || 'https://via.placeholder.com/50'} alt={p.nome} className="item-thumbnail" /> <span>{p.nome} - R$ {Number(p.preco).toFixed(2)}</span> <div className="item-buttons"> <button onClick={() => handleEditProduto(p)} className="admin-button edit-button">Editar</button> <button onClick={() => handleDelete(p.id)} className="admin-button delete-button">Deletar</button> </div> </div> ))} </div>
      <div className="order-management-section"> <h2>Pedidos Recebidos</h2> <div className="order-list"> {pedidos.length > 0 ? pedidos.map(pedido => ( <div key={pedido.id} className="order-card"> <div className="order-card-header"> <h4>Pedido #{pedido.id} - {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</h4> <div className="order-status-control"> <select value={pedido.status} onChange={(e) => handleStatusChange(pedido.id, e.target.value)}> <option value="Recebido">Recebido</option> <option value="Em Preparo">Em Preparo</option> <option value="Saiu para Entrega">Saiu para Entrega</option> <option value="Entregue">Entregue</option> <option value="Cancelado">Cancelado</option> </select> </div> </div> <div className="order-card-body"> <p><strong>Cliente:</strong> {pedido.nome_cliente}</p> <p><strong>Endereço:</strong> {pedido.endereco_cliente}</p> <p><strong>Itens:</strong></p> <ul> {pedido.itens?.map(item => { const produtoInfo = produtos.find(p => p.id === item.produto_id); const produtoNome = produtoInfo ? produtoInfo.nome : `Produto (ID: ${item.produto_id})`; return ( <li key={item.id}> {item.quantidade}x {produtoNome} - R$ {Number(item.preco_unitario).toFixed(2)} </li> ); })} </ul> </div> <div className="order-card-footer"> <span><strong>Pagamento:</strong> {pedido.metodo_pagamento} {pedido.metodo_pagamento === 'Dinheiro' ? `(Troco p/ R$ ${Number(pedido.troco_para).toFixed(2)})` : ''}</span> <strong>Total: R$ {Number(pedido.valor_total).toFixed(2)}</strong> </div> </div> )) : <p>Nenhum pedido recebido ainda.</p>} </div> </div>
    </div>
  );
}

export default AdminPage;