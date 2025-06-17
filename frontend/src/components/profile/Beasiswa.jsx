import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Import komponen PopupDetail Anda
import PopupDetail from '../scholarshiphub/PopupDetail'; // Sesuaikan path jika berbeda

// Definisikan base URL API Anda
const API_URL = "http://localhost:5000";

const ScholarshipCard = ({ image, title, description, onViewDetail, onRemoveSaved }) => {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col shadow-md h-full">
      <div className="h-32 w-full mb-3">
        {/* Tambahkan pengecekan `image` sebelum merender `<img>` */}
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          // Placeholder jika tidak ada gambar
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 text-sm">
            Tidak Ada Gambar
          </div>
        )}
      </div>
      <h3 className="text-base font-bold text-[#17355c] mb-2">{title}</h3>
      {/* Batasi deskripsi agar tidak terlalu panjang di card */}
      <p className="text-sm text-[#5e5a5a] flex-grow overflow-hidden text-ellipsis line-clamp-3">
        {description && description.length > 100 ? description.substring(0, 100) + '...' : description}
      </p>
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={onViewDetail}
          className="bg-[#3375cc] text-white text-sm font-semibold py-2 px-4 rounded-lg flex-grow mr-2 hover:bg-[#295ea3] transition-colors"
        >
          Lihat detail
        </button>
        <button
          onClick={onRemoveSaved}
          className="bg-red-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
        >
          Hapus
        </button>
      </div>
    </div>
  );
};

const SavedScholarships = () => {
  const navigate = useNavigate();
  const [savedScholarships, setSavedScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCardData, setSelectedCardData] = useState(null);

  // --- Fungsi untuk memuat beasiswa yang disimpan ---
  const fetchSavedScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/users/saved-beasiswa`, {
        withCredentials: true
      });
      // Memproses data untuk membentuk URL gambar lengkap
      const formattedData = response.data.map(item => {
        // Asumsi: item bisa langsung detail beasiswa ATAU memiliki properti 'beasiswa' nested
        const beasiswaDetail = item.beasiswa || item; 
        return {
          ...beasiswaDetail,
          // Menggabungkan API_URL dengan path gambar relatif dari backend
          img: beasiswaDetail.img ? `${API_URL}${beasiswaDetail.img}` : null
        };
      });
      setSavedScholarships(formattedData);
    } catch (err) {
      console.error("Error fetching saved scholarships:", err);
      setError("Gagal memuat beasiswa tersimpan. Silakan coba lagi.");
      if (err.response) {
        if (err.response.status === 401) {
          navigate("/login");
        } else if (err.response.status === 403) {
          setError("Anda tidak memiliki izin untuk melihat beasiswa tersimpan.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Fungsi untuk mengambil detail beasiswa berdasarkan UUID ---
  const fetchBeasiswaDetail = async (uuid) => {
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/beasiswa/${uuid}`);
      // Memproses data detail untuk membentuk URL gambar lengkap
      const detailData = {
        ...response.data,
        img: response.data.img ? `${API_URL}${response.data.img}` : null
      };
      setSelectedCardData(detailData);
      setShowPopup(true);
    } catch (err) {
      console.error(
        "Error fetching beasiswa detail:",
        err.response ? err.response.data : err.message
      );
      setError("Gagal mengambil detail beasiswa. Silakan coba lagi.");
    }
  };

  // --- Memuat beasiswa saat komponen pertama kali dimuat ---
  useEffect(() => {
    fetchSavedScholarships();
  }, []);

  // --- Fungsi untuk menghapus beasiswa dari daftar simpanan ---
  const handleRemoveSaved = async (beasiswaUuid) => {
    try {
      await axios.delete(`${API_URL}/users/saved-beasiswa/${beasiswaUuid}`, {
        withCredentials: true
      });
      setSavedScholarships(prevScholarships =>
        prevScholarships.filter(scholarship => scholarship.uuid !== beasiswaUuid)
      );
      alert("Beasiswa berhasil dihapus dari daftar simpanan.");
    } catch (err) {
      console.error("Error removing saved scholarship:", err);
      alert("Gagal menghapus beasiswa dari daftar simpanan.");
    }
  };

  // Fungsi yang dipanggil saat tombol 'Lihat detail' di ScholarshipCard diklik
  const handleViewDetail = (uuid) => {
    fetchBeasiswaDetail(uuid);
  };

  // Fungsi untuk menutup popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedCardData(null);
  };

  // --- Fungsi yang dipanggil saat tombol 'Simpan/Batal Simpan' di PopupDetail diklik ---
  const handleToggleSaveFromPopup = async () => {
    if (selectedCardData && selectedCardData.uuid) {
      await handleRemoveSaved(selectedCardData.uuid);
      handleClosePopup();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[15px] p-6 mb-5 text-center">
        <p>Memuat beasiswa tersimpan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[15px] p-6 mb-5 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[15px] p-6 mb-5">
      <h2 className="text-2xl font-semibold text-[#17355c] mb-6">
        Beasiswa Tersimpan
      </h2>
      {savedScholarships.length === 0 ? (
        <p className="text-center text-gray-600">Anda belum memiliki beasiswa tersimpan.</p>
      ) : (
        // Layout grid TIDAK DIUBAH, tetap seperti ini:
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {savedScholarships.map((item) => (
            <ScholarshipCard
              key={item.uuid}
              image={item.img} // `item.img` sekarang akan menjadi URL lengkap
              title={item.title}
              description={item.description}
              onViewDetail={() => handleViewDetail(item.uuid)}
              onRemoveSaved={() => handleRemoveSaved(item.uuid)}
            />
          ))}
        </div>
      )}

      {/* Render PopupDetail */}
      <PopupDetail
        show={showPopup}
        onClose={handleClosePopup}
        data={selectedCardData}
        isSaved={true} // Selalu true karena ini halaman beasiswa tersimpan
        onSave={handleToggleSaveFromPopup}
      />
    </div>
  );
};

export default SavedScholarships;