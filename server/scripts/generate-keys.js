import crypto from 'crypto';

console.log('--------------------------------------------------');
console.log('🔑 KUNCI RAHASIA UNTUK FILE .env ANDA 🔑');
console.log('--------------------------------------------------\n');

const betterAuthSecret = crypto.randomBytes(32).toString('hex');
console.log('BETTER_AUTH_SECRET=' + betterAuthSecret);
console.log('(Gunakan ini untuk sesi keamanan Better Auth)\n');

const encryptionSecretKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_SECRET_KEY=' + encryptionSecretKey);
console.log('(⚠️ SANGAT VITAL! Simpan baik-baik. Digunakan untuk enkripsi NIK/KK dengan AES-256)\n');

const hashSalt = crypto.randomBytes(16).toString('hex');
console.log('HASH_SALT=' + hashSalt);
console.log('(Gunakan ini untuk Salt Hashing / Blind Indexing)\n');

console.log('--------------------------------------------------');
console.log('Silakan copy-paste baris kode di atas ke dalam file server/.env');
console.log('--------------------------------------------------');