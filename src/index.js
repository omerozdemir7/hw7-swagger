import { initMongoConnection } from './db/initMongoConnection.js';
import { setupServer } from './server.js';

const bootstrap = async () => {
  try {
    // 1. Önce Veritabanı Bağlantısını Kur
    await initMongoConnection();
    
    // 2. Bağlantı başarılıysa Sunucuyu Başlat
    setupServer();
  } catch (error) {
    console.error('Veritabanı bağlantısı veya sunucu başlatma hatası:', error);
  }
};

bootstrap();