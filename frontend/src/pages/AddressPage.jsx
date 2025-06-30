// Arquivo: frontend/src/pages/AddressPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './AddressPage.css';

const API_ENDERECOS_URL = 'https://hortifruti-backend.onrender.com/api/enderecos';

function AddressPage() {
    const { token } = useAuth();
    const [enderecos, setEnderecos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [formEndereco, setFormEndereco] = useState({
        nome_identificador: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
    });

    const fetchEnderecos = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDERECOS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar endereços.');
            const data = await response.json();
            setEnderecos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchEnderecos();
    }, [fetchEnderecos]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormEndereco(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(API_ENDERECOS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formEndereco)
            });
            if (!response.ok) throw new Error('Não foi possível salvar o endereço.');
            
            // Limpa o formulário e recarrega a lista
            setFormEndereco({ nome_identificador: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
            fetchEnderecos();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Tem certeza que deseja deletar este endereço?')) return;
        try {
            await fetch(`${API_ENDERECOS_URL}/${addressId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchEnderecos(); // Recarrega a lista
        } catch (err) {
            setError('Falha ao deletar o endereço.');
        }
    };

    return (
        <div className="address-manager-container">
            <h2>Meus Endereços</h2>

            <form onSubmit={handleSaveAddress} className="address-form">
                <h3>Adicionar Novo Endereço</h3>
                <input name="nome_identificador" value={formEndereco.nome_identificador} onChange={handleInputChange} placeholder="Identificador (ex: Casa, Trabalho)" required />
                <input name="cep" value={formEndereco.cep} onChange={handleInputChange} placeholder="CEP" required />
                <input name="logradouro" value={formEndereco.logradouro} onChange={handleInputChange} placeholder="Rua / Logradouro" required />
                <input name="numero" value={formEndereco.numero} onChange={handleInputChange} placeholder="Número" required />
                <input name="complemento" value={formEndereco.complemento} onChange={handleInputChange} placeholder="Complemento (opcional)" />
                <input name="bairro" value={formEndereco.bairro} onChange={handleInputChange} placeholder="Bairro" required />
                <input name="cidade" value={formEndereco.cidade} onChange={handleInputChange} placeholder="Cidade" required />
                <input name="estado" value={formEndereco.estado} onChange={handleInputChange} placeholder="Estado" required />
                <button type="submit" className="primary-button">Salvar Endereço</button>
            </form>
            
            <div className="address-list">
                <h3>Endereços Salvos</h3>
                {isLoading && <p>Carregando...</p>}
                {error && <p className="error-message">{error}</p>}
                {enderecos.length > 0 ? (
                    enderecos.map(addr => (
                        <div key={addr.id} className="address-card">
                            <h4>{addr.nome_identificador}</h4>
                            <p>{addr.logradouro}, {addr.numero} {addr.complemento && `- ${addr.complemento}`}</p>
                            <p>{addr.bairro}, {addr.cidade} - {addr.estado}</p>
                            <p>CEP: {addr.cep}</p>
                            <button onClick={() => handleDeleteAddress(addr.id)} className="delete-address-btn">Deletar</button>
                        </div>
                    ))
                ) : (
                    !isLoading && <p>Nenhum endereço salvo.</p>
                )}
            </div>
        </div>
    );
}

export default AddressPage;