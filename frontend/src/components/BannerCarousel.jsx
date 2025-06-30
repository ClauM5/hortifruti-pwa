// Arquivo: frontend/src/components/BannerCarousel.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. Importa os componentes e estilos do Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import './BannerCarousel.css';

const API_BANNERS_URL = 'https://hortifruti-backend.onrender.com/api/banners/ativos';

function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(API_BANNERS_URL)
      .then(res => res.json())
      .then(data => setBanners(data))
      .catch(error => console.error("Erro ao buscar banners:", error));
  }, []);

  const handleBannerClick = (linkUrl) => {
    if (!linkUrl) return;
    navigate(linkUrl);
  };

  if (banners.length === 0) {
    return null; // Se não houver banners, não renderiza nada
  }

  return (
    <div className="carousel-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={50}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        autoplay={{
          delay: 5000, // Passa para o próximo slide a cada 5 segundos
          disableOnInteraction: false,
        }}
        effect="fade"
      >
        {banners.map(banner => (
          <SwiperSlide 
            key={banner.id} 
            onClick={() => handleBannerClick(banner.link_url)}
            className={banner.link_url ? 'clickable' : ''}
          >
            <img src={banner.imagem_url} alt={banner.titulo || 'Banner promocional'} />
            {(banner.titulo || banner.subtitulo) && (
              <div className="banner-text">
                {banner.titulo && <h2>{banner.titulo}</h2>}
                {banner.subtitulo && <p>{banner.subtitulo}</p>}
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default BannerCarousel;