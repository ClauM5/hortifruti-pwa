// Arquivo: frontend/src/pages/AdminPage.jsx (Com Gerenciador de Cupons)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AdminPage.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';
const WS_URL = 'wss://hortifruti-backend.onrender.com';

function AdminPage() {
  // Estados existentes
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [banners, setBanners] = useState([]);
  const [senha, setSenha] = useState('102030');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Formulários
  const [formProduto, setFormProduto] = useState({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '', categorias: [] });
  const [imagemFile, setImagemFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formCategoria, setFormCategoria] = useState({ id: null, nome: '' });
  const [formBanner, setFormBanner] = useState({ id: null, titulo: '', subtitulo: '', imagem_url: '', link_url: '', is_active: true, ordem: 0 });
  const [bannerFile, setBannerFile] = useState(null);
  // << NOVOS ESTADOS PARA CUPONS >>
  const [cupons, setCupons] = useState([]);
  const [formCupom, setFormCupom] = useState({ id: null, codigo: '', tipo_desconto: 'PERCENTUAL', valor: '', data_validade: '', ativo: true, usos_maximos: null });

  const notificationSound = useRef(null);

  // --- Funções de API ---
  const fetchAdminData = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const headers = { 'authorization': "102030" };
      const [pRes, peRes, cRes, bRes, cupRes] = await Promise.all([
        fetch(`${API_BASE_URL}/produtos`),
        fetch(`${API_BASE_URL}/pedidos`, { headers }),
        fetch(`${API_BASE_URL}/categorias`),
        fetch(`${API_BASE_URL}/banners`, { headers }),
        fetch(`${API_BASE_URL}/cupons`, { headers }) // << BUSCA OS CUPONS TAMBÉM
      ]);
      if (!pRes.ok || !peRes.ok || !cRes.ok || !bRes.ok || !cupRes.ok) throw new Error('Falha ao carregar dados.');
      setProdutos(await pRes.json());
      setPedidos(await peRes.json());
      setCategorias(await cRes.json());
      setBanners(await bRes.json());
      setCupons(await cupRes.json()); // << ATUALIZA O ESTADO DOS CUPONS
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  }, []);
  
  // ... (Funções de API existentes continuam as mesmas)...
  const handleStatusChange = useCallback(async (pedidoId, novoStatus) => { setError(''); try { const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'authorization': "102030" }, body: JSON.stringify({ status: novoStatus }) }); if (!response.ok) throw new Error('Falha ao atualizar status.'); setPedidos(prevPedidos => prevPedidos.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p)); } catch (err) { setError(err.message); } }, []);
  const handleImageUpload = async (file) => { if (!file) return null; setIsUploading(true); const formData = new FormData(); formData.append('image', file); try { const response = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', headers: { 'authorization': "102030" }, body: formData, }); if (!response.ok) throw new Error('Falha no upload da imagem.'); return (await response.json()).imageUrl; } catch (err) { setError(err.message); return null; } finally { setIsUploading(false); } };
  const handleSaveProduto = async (e) => { e.preventDefault(); setIsLoading(true); let imageUrl = formProduto.imagem; if (imagemFile) { imageUrl = await handleImageUpload(imagemFile); if (!imageUrl) { setIsLoading(false); return; } } const categoriaIds = formProduto.categorias.map(cat => cat.id); const produtoData = { ...formProduto, imagem: imageUrl, categorias: categoriaIds }; const { id, ...data } = produtoData; const method = id ? 'PUT' : 'POST'; const url = id ? `${API_BASE_URL}/produtos/${id}` : `${API_BASE_URL}/produtos`; try { const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'authorization': "102030" }, body: JSON.stringify(data) }); if (!response.ok) throw new Error(`Falha ao salvar produto.`); clearFormProduto(); fetchAdminData(); } catch (err) { setError(err.message); } finally { setIsLoading(false); } };
  const handleDelete = async (produtoId) => { if (!window.confirm("Certeza?")) return; setIsLoading(true); try { await fetch(`${API_BASE_URL}/produtos/${produtoId}`, { method: 'DELETE', headers: { 'authorization': "102030" } }); fetchAdminData(); } catch (err) { setError(err.message) } finally { setIsLoading(false) } };
  const handleSaveCategoria = async (e) => { e.preventDefault(); const { id, nome } = formCategoria; if (!nome) return; const method = id ? 'PUT' : 'POST'; const url = id ? `${API_BASE_URL}/categorias/${id}` : `${API_BASE_URL}/categorias`; try { await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'authorization': "102030" }, body: JSON.stringify({ nome }) }); setFormCategoria({ id: null, nome: '' }); fetchAdminData(); } catch (err) { setError('Falha ao salvar categoria.'); } };
  const handleDeleteCategoria = async (catId) => { if (!window.confirm("Certeza?")) return; try { await fetch(`${API_BASE_URL}/categorias/${catId}`, { method: 'DELETE', headers: { 'authorization': "102030" } }); fetchAdminData(); } catch (err) { setError('Falha ao deletar categoria.'); } };
  const handleSaveBanner = async (e) => { e.preventDefault(); setIsLoading(true); let imageUrl = formBanner.imagem_url; if (bannerFile) { imageUrl = await handleImageUpload(bannerFile); if(!imageUrl) { setIsLoading(false); return; } } const bannerData = { ...formBanner, imagem_url: imageUrl }; const { id, ...data } = bannerData; const method = id ? 'PUT' : 'POST'; const url = id ? `${API_BASE_URL}/banners/${id}` : `${API_BASE_URL}/banners`; try { await fetch(url, { method, headers: {'Content-Type': 'application/json', 'authorization': '102030'}, body: JSON.stringify(data)}); clearFormBanner(); fetchAdminData(); } catch (err) { setError('Falha ao salvar banner.'); } finally { setIsLoading(false); } };
  const handleDeleteBanner = async (bannerId) => { if (!window.confirm("Certeza?")) return; try { await fetch(`${API_BASE_URL}/banners/${bannerId}`, { method: 'DELETE', headers: { 'authorization': '102030' } }); fetchAdminData(); } catch (err) { setError('Falha ao deletar banner.'); } };

  // << NOVAS FUNÇÕES CRUD PARA CUPONS >>
  const handleSaveCupom = async (e) => {
    e.preventDefault();
    setError('');
    const cupomData = {
        ...formCupom,
        usos_maximos: formCupom.usos_maximos || null,
        data_validade: formCupom.data_validade || null,
    };
    const { id, ...data } = cupomData;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/cupons/${id}` : `${API_BASE_URL}/cupons`;
    try {
        await fetch(url, { method, headers: {'Content-Type': 'application/json', 'authorization': '102030'}, body: JSON.stringify(data) });
        clearFormCupom();
        fetchAdminData();
    } catch(err) {
        setError('Falha ao salvar cupom. O código já existe?');
    }
  };
  const handleDeleteCupom = async (cupomId) => {
    if (!window.confirm("Tem certeza?")) return;
    try {
        await fetch(`${API_BASE_URL}/cupons/${cupomId}`, { method: 'DELETE', headers: { 'authorization': '102030' } });
        fetchAdminData();
    } catch (err) {
        setError('Falha ao deletar cupom.');
    }
  };
  
  // --- Funções Auxiliares ---
  const handleEditProduto = (produto) => { const catProd = categorias.filter(cat => produto.categorias?.includes(cat.nome)); setFormProduto({ ...produto, categorias: catProd }); setImagemFile(null); window.scrollTo(0, 0); };
  const clearFormProduto = () => setFormProduto({ id: null, nome: '', preco: '', unidade: 'kg', imagem: '', categorias: [] });
  const handleFormChange = (e) => setFormProduto(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFileChange = (e) => setImagemFile(e.target.files[0]);
  const handleCategoryChange = (categoria) => { setFormProduto(prev => { const existe = prev.categorias.find(c => c.id === categoria.id); if (existe) { return { ...prev, categorias: prev.categorias.filter(c => c.id !== categoria.id) }; } else { return { ...prev, categorias: [...prev.categorias, categoria] }; } }); };
  const handleLogin = () => { if (senha === "102030") setIsLoggedIn(true); else alert('Senha incorreta!'); };
  const handleBannerFormChange = (e) => { const { name, value, type, checked } = e.target; setFormBanner(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
  const handleBannerFileChange = (e) => setBannerFile(e.target.files[0]);
  const handleEditBanner = (banner) => setFormBanner(banner);
  const clearFormBanner = () => setFormBanner({ id: null, titulo: '', subtitulo: '', imagem_url: '', link_url: '', is_active: true, ordem: 0 });
  // << NOVAS FUNÇÕES AUXILIARES PARA CUPONS >>
  const handleCupomFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormCupom(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleEditCupom = (cupom) => setFormCupom({ ...cupom, data_validade: cupom.data_validade ? cupom.data_validade.split('T')[0] : ''});
  const clearFormCupom = () => setFormCupom({ id: null, codigo: '', tipo_desconto: 'PERCENTUAL', valor: '', data_validade: '', ativo: true, usos_maximos: null });


  useEffect(() => { if (!isLoggedIn) return; fetchAdminData(); notificationSound.current = new Audio('/notification.mp3'); const ws = new WebSocket(WS_URL); ws.onopen = () => console.log('Conectado'); ws.onmessage = (event) => { const message = JSON.parse(event.data); if (message.type === 'NOVO_PEDIDO') { notificationSound.current.play().catch(e=>console.log(e)); setPedidos(prev => [message.payload, ...prev]); document.title = ">> NOVO PEDIDO! <<"; setTimeout(() => { document.title = "Painel de Admin"; }, 5000); } }; ws.onclose = () => console.log('Desconectado'); return () => ws.close(); }, [isLoggedIn, fetchAdminData]);
  if (!isLoggedIn) { return ( <div className="admin-login-container"> <h2>Painel de Administrador</h2> <input type="password" placeholder="Digite a senha" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="admin-input"/> <button onClick={handleLogin} className="admin-button">Entrar</button> </div> ); }

  // --- RENDERIZAÇÃO ---
  return (
    <div className="admin-container">
      <div className="admin-header"> <h2>Gerenciar Produtos e Pedidos</h2> <button onClick={() => setIsLoggedIn(false)} className="admin-button logout-button">Sair</button> </div>
      {error && <p className="error-message">{error}</p>} {isLoading && <p>Carregando...</p>}
      
      {/* Seção de Gerenciamento de Cupons */}
      <div className="admin-section">
        <h3>Gerenciar Cupons de Desconto</h3>
        <form onSubmit={handleSaveCupom} className="admin-form">
            <h4>{formCupom.id ? 'Editando Cupom' : 'Adicionar Novo Cupom'}</h4>
            <input type="text" name="codigo" placeholder="Código (ex: BEMVINDO10)" value={formCupom.codigo} onChange={handleCupomFormChange} required />
            <select name="tipo_desconto" value={formCupom.tipo_desconto} onChange={handleCupomFormChange}>
                <option value="PERCENTUAL">Percentual (%)</option>
                <option value="FIXO">Valor Fixo (R$)</option>
            </select>
            <input type="number" name="valor" placeholder="Valor do Desconto" value={formCupom.valor} onChange={handleCupomFormChange} required step="0.01" />
            <label>Data de Validade (opcional): <input type="date" name="data_validade" value={formCupom.data_validade} onChange={handleCupomFormChange} /></label>
            <label>Usos Máximos (opcional): <input type="number" name="usos_maximos" placeholder="Deixe em branco para ilimitado" value={formCupom.usos_maximos || ''} onChange={handleCupomFormChange} /></label>
            <label><input type="checkbox" name="ativo" checked={formCupom.ativo} onChange={handleCupomFormChange} /> Ativo?</label>
            <div className="form-buttons">
              <button type="submit" className="admin-button save-button">Salvar Cupom</button>
              {formCupom.id && <button type="button" onClick={clearFormCupom} className="admin-button clear-button">Cancelar Edição</button>}
            </div>
        </form>
        <div className="coupon-list">
            {cupons.map(cupom => (
                <div key={cupom.id} className="list-item">
                    <span><strong>{cupom.codigo}</strong> ({cupom.tipo_desconto === 'PERCENTUAL' ? `${cupom.valor}%` : `R$${cupom.valor}`})</span>
                    <span>Usos: {cupom.usos_atuais || 0}/{cupom.usos_maximos || '∞'}</span>
                    <span className={cupom.ativo ? 'status-active' : 'status-inactive'}>{cupom.ativo ? 'Ativo' : 'Inativo'}</span>
                    <div className="item-buttons">
                        <button onClick={() => handleEditCupom(cupom)} className="admin-button edit-button">Editar</button>
                        <button onClick={() => handleDeleteCupom(cupom.id)} className="admin-button delete-button">Deletar</button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Outras Seções (Banners, Categorias, Produtos, Pedidos) */}
      {/* ... (O JSX das outras seções continua aqui, sem alterações) */}
      <div className="admin-section"> <h3>Gerenciar Banners</h3> <form onSubmit={handleSaveBanner} className="admin-form"> <h4>{formBanner.id ? 'Editando Banner' : 'Novo Banner'}</h4> <input type="text" name="titulo" placeholder="Título" value={formBanner.titulo} onChange={handleBannerFormChange} /> <input type="text" name="subtitulo" placeholder="Subtítulo" value={formBanner.subtitulo} onChange={handleBannerFormChange} /> <input type="text" name="link_url" placeholder="URL de destino" value={formBanner.link_url} onChange={handleBannerFormChange} /> <input type="number" name="ordem" placeholder="Ordem" value={formBanner.ordem} onChange={handleBannerFormChange} /> <label><input type="checkbox" name="is_active" checked={formBanner.is_active} onChange={handleBannerFormChange} /> Ativo?</label> <label>Imagem: <input type="file" onChange={handleBannerFileChange} accept="image/*" /></label> <div className="form-buttons"> <button type="submit" className="admin-button save-button" disabled={isUploading}>Salvar</button> {formBanner.id && <button type="button" onClick={clearFormBanner} className="admin-button clear-button">Cancelar</button>} </div> </form> <div className="banner-list"> {banners.map(b => ( <div key={b.id} className="banner-item"> <img src={b.imagem_url} alt={b.titulo || 'Banner'} className="item-thumbnail"/> <span>{b.titulo || 'Banner'} (Ordem: {b.ordem})</span> <span className={b.is_active ? 'status-active' : 'status-inactive'}>{b.is_active ? 'Ativo' : 'Inativo'}</span> <div className="item-buttons"> <button onClick={() => handleEditBanner(b)} className="admin-button edit-button">Editar</button> <button onClick={() => handleDeleteBanner(b.id)} className="admin-button delete-button">Deletar</button> </div> </div> ))} </div> </div>
      <div className="admin-section"> <div className="category-manager"> <h3>Gerenciar Categorias</h3> <form onSubmit={handleSaveCategoria} className="category-form"> <input type="text" placeholder="Nome da categoria" value={formCategoria.nome} onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })} /> <button type="submit" className="admin-button">Salvar</button> </form> <div className="category-list"> {categorias.map(cat => ( <div key={cat.id} className="category-item"> <span>{cat.nome}</span> <button onClick={() => handleDeleteCategoria(cat.id)} className="delete-button-small">X</button> </div> ))} </div> </div> </div>
      <div className="admin-section"> <form onSubmit={handleSaveProduto} className="admin-form"> <h3>{formProduto.id ? 'Editando Produto' : 'Novo Produto'}</h3> <input type="text" name="nome" placeholder="Nome" value={formProduto.nome} onChange={handleFormChange} required /> <input type="number" name="preco" placeholder="Preço" value={formProduto.preco} onChange={handleFormChange} required step="0.01" /> <input type="text" name="unidade" placeholder="Unidade" value={formProduto.unidade} onChange={handleFormChange} required /> <label>Imagem:</label> <input type="file" onChange={handleFileChange} accept="image/*" /> <div className="category-checkboxes"> <label>Categorias:</label> {categorias.map(cat => ( <label key={cat.id}> <input type="checkbox" checked={formProduto.categorias.some(c => c.id === cat.id)} onChange={() => handleCategoryChange(cat)} /> {cat.nome} </label> ))} </div> <div className="form-buttons"> <button type="submit" className="admin-button save-button" disabled={isUploading}>Salvar</button> {formProduto.id && <button type="button" onClick={clearFormProduto} className="admin-button clear-button">Cancelar</button>} </div> </form> <div className="product-list"> {produtos.map(p => ( <div key={p.id} className="product-item"> <img src={p.imagem || 'https://via.placeholder.com/50'} alt={p.nome} className="item-thumbnail" /> <span>{p.nome} - R$ {Number(p.preco).toFixed(2)}</span> <div className="item-buttons"> <button onClick={() => handleEditProduto(p)} className="admin-button edit-button">Editar</button> <button onClick={() => handleDelete(p.id)} className="admin-button delete-button">Deletar</button> </div> </div> ))} </div> </div>
      <div className="admin-section"> <div className="order-management-section"> <h2>Pedidos Recebidos</h2> <div className="order-list"> {pedidos.length > 0 ? pedidos.map(pedido => ( <div key={pedido.id} className="order-card"> <div className="order-card-header"> <h4>Pedido #{pedido.id}</h4> <div className="order-status-control"> <select value={pedido.status} onChange={(e) => handleStatusChange(pedido.id, e.target.value)}> <option value="Recebido">Recebido</option> <option value="Em Preparo">Em Preparo</option> <option value="Pronto para retirada">Pronto para retirada</option> <option value="Saiu para Entrega">Saiu para Entrega</option> <option value="Entregue">Entregue</option> <option value="Cancelado">Cancelado</option> </select> </div> </div> <div className="order-card-body"> <p><strong>Cliente:</strong> {pedido.nome_cliente}</p> <p><strong>Itens:</strong></p> <ul> {pedido.itens?.map(item => { const produtoInfo = produtos.find(p => p.id === item.produto_id); const produtoNome = produtoInfo ? produtoInfo.nome : `Produto ID ${item.produto_id}`; return ( <li key={item.id}> {item.quantidade}x {produtoNome}</li> ); })} </ul> </div> </div> )) : <p>Nenhum pedido.</p>} </div> </div> </div>
    </div>
  );
}

export default AdminPage;