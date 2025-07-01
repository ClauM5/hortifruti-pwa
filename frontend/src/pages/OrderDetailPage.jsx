// Arquivo: frontend/src/pages/OrderDetailPage.jsx (Com WS_URL corrigido)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OrderDetailPage.css';

const API_BASE_URL = 'https://hortifruti-backend.onrender.com/api';
const WS_URL = 'wss://hortifruti-backend.onrender.com'; // << GARANTINDO QUE ESTÁ AQUI

const StatusTimeline = ({ status }) => {
    const statuses = ['Recebido', 'Em Preparo', 'Pronto para retirada', 'Saiu para Entrega', 'Entregue'];
    const displayStatus = statuses.includes(status) ? status : 'Recebido';
    const currentStatusIndex = statuses.indexOf(displayStatus);
    return ( <div className="timeline-container"> {statuses.map((s, index) => ( <div key={s} className={`timeline-step ${index <= currentStatusIndex ? 'completed' : ''}`}> <div className="timeline-dot"></div> <div className="timeline-label">{s}</div> </div> ))} </div> );
};

function OrderDetailPage() {
    const { id: pedidoId } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPedidoDetails = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Não foi possível carregar os detalhes do pedido.');
            const data = await response.json();
            setPedido(data);
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, [pedidoId, token]);

    useEffect(() => { fetchPedidoDetails(); }, [fetchPedidoDetails]);

    useEffect(() => {
        if (!token) return;
        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        ws.onopen = () => console.log('Conectado ao WebSocket para rastreamento.');
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'STATUS_UPDATE' && message.payload.pedidoId === parseInt(pedidoId)) {
                setPedido(prevPedido => ({ ...prevPedido, status: message.payload.novoStatus }));
            }
        };
        ws.onclose = () => console.log('Desconectado do WebSocket de rastreamento.');
        return () => ws.close();
    }, [token, pedidoId]);

    if (loading) return <p>Carregando detalhes do pedido...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!pedido) return <p>Pedido não encontrado.</p>;

    return (
        <div className="order-detail-container">
            <button onClick={() => navigate('/minha-conta')} className="back-button">&larr; Voltar para Meus Pedidos</button>
            <h2>Detalhes do Pedido #{pedido.id}</h2>
            <div className="order-detail-card status-card"> <h3>Status do Pedido</h3> <StatusTimeline status={pedido.status} /> </div>
            <div className="order-detail-card items-card"> <h3>Itens do Pedido</h3> <ul>{pedido.itens.map(item => (<li key={item.id}><span>{item.quantidade}x {item.produto_nome}</span><span>R$ {(Number(item.preco_unitario) * item.quantity).toFixed(2).replace('.', ',')}</span></li>))}</ul> <div className="order-total"><strong>Total: R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}</strong></div> </div>
            <div className="order-detail-card info-card">
                <h3>Informações do Pedido</h3>
                <p><strong>Cliente:</strong> {pedido.nome_cliente}</p>
                <p><strong>Pagamento:</strong> {pedido.metodo_pagamento}</p>
                {pedido.endereco_cliente === 'Retirada na Loja' ? ( <div className="pickup-info-details"><p><strong>Modalidade:</strong> Retirada na Loja</p></div> ) : ( <p><strong>Endereço de Entrega:</strong> {pedido.endereco_cliente}</p> )}
            </div>
        </div>
    );
}

export default OrderDetailPage;