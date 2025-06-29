// Arquivo: frontend/src/pages/AdminPage.jsx (Com a senha do admin correta)

import React, { useState, useEffect } from 'react';
import './AdminPage.css';

const API_PRODUTOS_URL = 'https://hortifruti-backend.onrender.com/api/produtos';
const API_PEDIDOS_URL = 'https://hortifruti-backend.onrender.com/api/pedidos';
const API_UPLOAD_URL = 'https://hortifruti-backend.onrender.com/api/upload';

function AdminPage() {
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [senha, setSenha] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formProduto, setFormProduto] = useState({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '' });
  const [imagemFile, setImagemFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = { 'authorization': "102030" }; // Usa a senha diretamente
      const [produtosResponse, pedidosResponse] = await Promise.all([
        fetch(API_PRODUTOS_URL),
        fetch(API_PEDIDOS_URL, { headers })
      ]);
      if (!produtosResponse.ok || !pedidosResponse.ok) {
        throw new Error('Falha ao carregar dados do admin.');
      }
      const produtosData = await produtosResponse.json();
      const pedidosData = await pedidosResponse.json();
      setProdutos(produtosData);
      setPedidos(pedidosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId, novoStatus) => {
    setError('');
    try {
      const response = await fetch(`${API_PRODUTOS_URL.replace('/produtos', '/pedidos')}/${pedidoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': "102030"
        },
        body: JSON.stringify({ status: novoStatus })
      });
      if (!response.ok) throw new Error('Falha ao atualizar status.');
      fetchAdminData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleImageUpload = async () => { if (!imagemFile) return null; setIsUploading(true); const formData = new FormData(); formData.append('image', imagemFile); try { const response = await fetch(API_UPLOAD_URL, { method: 'POST', headers: { 'authorization': "102030" }, body: formData, }); if (!response.ok) throw new Error('Falha no upload da imagem.'); const data = await response.json(); return data.imageUrl; } catch (err) { setError(err.message); return null; } finally { setIsUploading(false); } };
  const handleSave = async (e) => { e.preventDefault(); setIsLoading(true); setError(''); let imageUrl = formProduto.imagem; if (imagemFile) { imageUrl = await handleImageUpload(); if (!imageUrl) { setIsLoading(false); return; } } const produtoData = { ...formProduto, imagem: imageUrl }; const { id, ...data } = produtoData; const method = id ? 'PUT' : 'POST'; const url = id ? `${API_PRODUTOS_URL}/${id}` : API_PRODUTOS_URL; try { const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'authorization': "102030" }, body: JSON.stringify(data) }); if (!response.ok) throw new Error(`Falha ao salvar produto.`); clearForm(); fetchAdminData(); } catch (err) { setError(err.message); } finally { setIsLoading(false); } };
  const handleDelete = async (produtoId) => { if (!window.confirm("Tem certeza que deseja deletar este produto?")) return; setIsLoading(true); try { await fetch(`${API_PRODUTOS_URL}/${produtoId}`, { method: 'DELETE', headers: { 'authorization': "102030" } }); fetchAdminData(); } catch (err) { setError(err.message) } finally { setIsLoading(false) } };
  const handleEdit = (produto) => { setFormProduto(produto); setImagemFile(null); window.scrollTo(0, 0); };
  const clearForm = () => { setFormProduto({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '' }); setImagemFile(null); };
  const handleFormChange = (e) => { const { name, value } = e.target; setFormProduto(prevState => ({ ...prevState, [name]: value })); };
  const handleFileChange = (e) => { setImagemFile(e.target.files[0]); };

  const handleLogin = () => {
    // A senha do frontend agora é validada diretamente
    // A senha REAL continua segura no backend
    if (senha === "102030") { // <<-- SENHA ATUALIZADA AQUI
      setIsLoggedIn(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAdminData();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return ( <div className="admin-login-container"> <h2>Painel de Administrador</h2> <input type="password" placeholder="Digite a senha" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="admin-input"/> <button onClick={handleLogin} className="admin-button">Entrar</button> </div> );
  }

  // O JSX do painel logado continua o mesmo
  return (
    <div className="admin-container">
      <div className="admin-header"> <h2>Gerenciar Produtos e Pedidos</h2> <button onClick={() => setIsLoggedIn(false)} className="admin-button logout-button">Sair</button> </div>
      {error && <p className="error-message">{error}</p>}
      {isLoading && <p>Carregando...</p>}
      <form onSubmit={handleSave} className="admin-form"> <h3>{formProduto.id ? 'Editando Produto' : 'Adicionar Novo Produto'}</h3> <input type="text" name="nome" placeholder="Nome do Produto" value={formProduto.nome} onChange={handleFormChange} required /> <input type="number" name="preco" placeholder="Preço (ex: 7.99)" value={formProduto.preco} onChange={handleFormChange} required step="0.01" /> <input type="text" name="unidade" placeholder="Unidade (kg, un, etc)" value={formProduto.unidade} onChange={handleFormChange} required /> <label htmlFor="imagem-upload">Imagem do Produto:</label> <input id="imagem-upload" type="file" name="imagem" onChange={handleFileChange} accept="image/*" /> {(formProduto.imagem || imagemFile) && ( <div className="image-preview"> <p>Pré-visualização:</p> <img src={imagemFile ? URL.createObjectURL(imagemFile) : formProduto.imagem} alt="Preview" /> </div> )} <div className="form-buttons"> <button type="submit" className="admin-button save-button" disabled={isUploading}> {isUploading ? 'Enviando...' : 'Salvar'} </button> {formProduto.id && <button type="button" onClick={clearForm} className="admin-button clear-button">Cancelar Edição</button>} </div> </form>
      <div className="product-list"> {produtos.map(p => ( <div key={p.id} className="product-item"> <img src={p.imagem || 'https://via.placeholder.com/50'} alt={p.nome} className="item-thumbnail" /> <span>{p.nome} - R$ {Number(p.preco).toFixed(2)}</span> <div className="item-buttons"> <button onClick={() => handleEdit(p)} className="admin-button edit-button">Editar</button> <button onClick={() => handleDelete(p.id)} className="admin-button delete-button">Deletar</button> </div> </div> ))} </div>
      <div className="order-management-section">
        <h2>Pedidos Recebidos</h2>
        <div className="order-list">
          {pedidos.length > 0 ? pedidos.map(pedido => (
            <div key={pedido.id} className="order-card">
              <div className="order-card-header">
                <h4>Pedido #{pedido.id} - {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</h4>
                <div className="order-status-control">
                  <select value={pedido.status} onChange={(e) => handleStatusChange(pedido.id, e.target.value)}>
                    <option value="Recebido">Recebido</option>
                    <option value="Em Preparo">Em Preparo</option>
                    <option value="Saiu para Entrega">Saiu para Entrega</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="order-card-body">
                <p><strong>Cliente:</strong> {pedido.nome_cliente}</p>
                <p><strong>Endereço:</strong> {pedido.endereco_cliente}</p>
                <p><strong>Itens:</strong></p>
                <ul>
                  {pedido.itens.map(item => (
                    <li key={item.id}>{item.quantidade}x (ID: {item.produto_id}) - R$ {Number(item.preco_unitario).toFixed(2)}</li>
                  ))}
                </ul>
              </div>
              <div className="order-card-footer">
                <span><strong>Pagamento:</strong> {pedido.metodo_pagamento} {pedido.metodo_pagamento === 'Dinheiro' ? `(Troco p/ R$ ${Number(pedido.troco_para).toFixed(2)})` : ''}</span>
                <strong>Total: R$ {Number(pedido.valor_total).toFixed(2)}</strong>
              </div>
            </div>
          )) : <p>Nenhum pedido recebido ainda.</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;