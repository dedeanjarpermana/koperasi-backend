// utils/idUtils.js

/**
 * Generate ID investasi dengan format tertentu.
 * @param {number} year - Tahun investasi (e.g., 2024).
 * @param {number} month - Bulan investasi (1-12).
 * @param {number} sequence - Urutan pendaftaran (e.g., 1 untuk pendaftar pertama).
 * @returns {string} - ID investasi yang diformat (e.g., "2412-001").
 */

// id untuk investasi:
const generateInvestasiID = (year, month, sequence) => {
    const yearPart = year.toString().slice(-2);
    const monthPart = month.toString().padStart(2, "0");
    const sequencePart = sequence.toString().padStart(3, "0");
    return `INV-${yearPart}${monthPart}-${sequencePart}`;
  };

  const generateTransaksiAmbilInvestasi = (year, month, sequence) => {
    const yearPart = year.toString().slice(-2);
    const monthPart = month.toString().padStart(2, "0");
    const sequencePart = sequence.toString().padStart(3, "0");
    return `withdraw-${yearPart}${monthPart}-${sequencePart}`;
  };
  

  function generateAnggotaID(year, month, sequence) {
    const formatYear = year.toString().slice(-2);
    const formatMonth = month.toString().padStart(2,"0");
    const formattedSequence = sequence.toString().padStart(3,"0");
    return `ANG-${formatYear}${formatMonth}-${formattedSequence}`;
  }

  
/**
 * Generate ID anggota dengan format tertentu.
 * @param {number} year - Tahun pendaftaran (e.g., 2024).
 * @param {number} month - Bulan investasi (1-12).
 * @param {number} sequence - Urutan pendaftaran (e.g., 1 untuk pendaftar pertama).
 * @returns {string} - ID investasi yang diformat (e.g., "2412-001").
 */

// function generateAnggotaID(year, month, sequence) {
//   const formattedMonth = String(month).padStart(2, '0');
//   // const formattedSequence = String(sequence).padStart(3, '0'); // Tambahkan padding untuk membuat ID lebih unik
//   // return `ANG-${year}${formattedMonth}-${formattedSequence}`;
//   return `ANG-${year}${formattedMonth}-${sequence}`; // Sequence tanpa padding
// }

/**
 * Generate ID transaksi untuk topup balance dengan format tertentu.
 * @param {number} year - Tahun investasi (e.g., 2024).
 * @param {number} month - Bulan investasi (1-12).
 * @param {number} sequence - Urutan pendaftaran (e.g., 1 untuk pendaftar pertama).
 * @returns {string} - ID investasi yang diformat (e.g., "2412-001").
 */


const generateTransaksiIDTopup = (year, month, sequence) => {
  const yearPart = year.toString().slice(-2);
  const monthPart = month.toString().padStart(2, "0");
  const sequencePart = sequence.toString().padStart(3, "0");
  return `idtopup-${yearPart}${monthPart}-${sequencePart}`;
};

const generateTransaksiIDCicilan = (year, month, sequence) => {
  const yearPart = year.toString().slice(-2);
  const monthPart = month.toString().padStart(2, "0");
  const sequencePart = sequence.toString().padStart(3, "0");
  return `transac-CICIL-${yearPart}${monthPart}-${sequencePart}`;
};


const generateOrderKreditID = (year, month, sequence) => {
  const yearPart = year.toString().slice(-2);
  const monthPart = month.toString().padStart(2, "0");
  const sequencePart = sequence.toString().padStart(3, "0");
  return `ORDERID-${yearPart}${monthPart}-${sequencePart}`;
};


const generateIDMenabung = (year, month, sequence) => {
  const yearPart = year.toString().slice(-2);
  const monthPart = month.toString().padStart(2, "0");
  const sequencePart = sequence.toString().padStart(3, "0");
  return `SAVING-${yearPart}${monthPart}-${sequencePart}`;
};

const generateTransaksiAmbilTabungan = (year, month, sequence) => {
  const yearPart = year.toString().slice(-2);
  const monthPart = month.toString().padStart(2, "0");
  const sequencePart = sequence.toString().padStart(3, "0");
  return `AMBIL-TAB-${yearPart}${monthPart}-${sequencePart}`;
};

const generateTransaksiPembelian = (year, month, sequence) => {
  const yearPart = year.toString().slice(-2);
  const monthPart = month.toString().padStart(2, "0");
  const sequencePart = sequence.toString().padStart(3, "0");
  return `PURCHASE-${yearPart}${monthPart}-${sequencePart}`;
};

module.exports = 
{ generateInvestasiID, 
  generateTransaksiAmbilInvestasi, 
  generateAnggotaID, 
  generateTransaksiIDTopup, 
  generateTransaksiIDCicilan, 
  generateOrderKreditID, 
  generateIDMenabung,
  generateTransaksiAmbilTabungan,
  generateTransaksiPembelian
 };
  