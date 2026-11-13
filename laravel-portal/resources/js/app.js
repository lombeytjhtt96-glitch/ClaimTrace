import './bootstrap';
import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';

Alpine.plugin(collapse);

// Global State Store
Alpine.store('claimtrace', {
    fastApiStatus: 'connected',
    verifierNip: '198704202011012001',
    verifierName: 'dr. Rizky Pratama, Sp.A',
    verifierRole: 'Verifikator Medis Senior',
});

window.Alpine = Alpine;
Alpine.start();
