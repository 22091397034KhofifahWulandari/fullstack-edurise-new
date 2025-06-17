import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";

import Header from "../../components/Navbar";
import Footer from "../../components/Footer";
import Card from "../../components/scholarshiphub/Card";
import PopupDetail from "../../components/scholarshiphub/PopupDetail";
import PopupSaved from "../../components/scholarshiphub/PopupSaved"; // Tetap gunakan ini untuk notifikasi simpan

const Rekomendasi = () => {
    const location = useLocation();
    const navigate = useNavigate(); // Inisialisasi useNavigate

    const initialFilters = location.state || {
        kategori: "",
        jenjang: "",
        lokasi: "",
        deadline: "",
    };

    const [filters, setFilters] = useState(initialFilters);
    const [selectedCard, setSelectedCard] = useState(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [showSavedPopup, setShowSavedPopup] = useState(false); // Ganti `saved` menjadi `showSavedPopup`
    const [beasiswaData, setBeasiswaData] = useState([]);
    const [userSavedBeasiswa, setUserSavedBeasiswa] = useState([]); // State baru untuk UUID beasiswa yang disimpan
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // PASTIKAN URL INI BENAR SESUAI DENGAN BACKEND ANDA
    const API_URL = "http://localhost:5000";

    axios.defaults.withCredentials = true; // Pastikan ini diatur jika menggunakan cookie/sesi

    // Fungsi untuk mengambil data beasiswa dari backend dengan filter
    const fetchFilteredBeasiswa = async (currentFilters) => {
        setLoading(true);
        setError(null);
        try {
            let url = `${API_URL}/beasiswa`;

            const queryParams = new URLSearchParams();
            if (currentFilters.kategori) queryParams.append("kategori", currentFilters.kategori);
            if (currentFilters.jenjang) queryParams.append("jenjang", currentFilters.jenjang);
            if (currentFilters.lokasi) queryParams.append("lokasi", currentFilters.lokasi);
            if (currentFilters.deadline) queryParams.append("deadline", currentFilters.deadline);

            if (queryParams.toString()) {
                url = `${url}?${queryParams.toString()}`;
            }

            console.log("Fetching filtered scholarships from URL:", url);
            const response = await axios.get(url);

            // **Penting: Ubah path gambar menjadi URL lengkap di sini**
            const formattedData = response.data.map(item => ({
                ...item,
                img: item.img ? `${API_URL}${item.img}` : null // Gabungkan dengan API_URL
            }));

            setBeasiswaData(formattedData);
            console.log("Fetched filtered data:", formattedData);
        } catch (err) {
            console.error(
                "Gagal mengambil data beasiswa rekomendasi:",
                err.response ? err.response.data : err.message
            );
            setError("Gagal memuat rekomendasi beasiswa. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi untuk mengambil beasiswa yang disimpan oleh pengguna ---
    const fetchUserSavedBeasiswa = async () => {
        try {
            const response = await axios.get(`${API_URL}/users/saved-beasiswa`);
            setUserSavedBeasiswa(response.data.map(item => item.uuid)); // Asumsi backend mengembalikan array UUID
        } catch (err) {
            console.error(
                "Error fetching user saved beasiswa:",
                err.response ? err.response.data : err.message
            );
            if (err.response && err.response.status === 401) {
                console.warn("User not logged in or session expired when fetching saved beasiswa.");
                // Tidak perlu navigasi otomatis ke login di sini jika tidak diperlukan pada setiap load
            } else {
                setError("Gagal mengambil daftar beasiswa tersimpan.");
            }
        }
    };

    // Fungsi untuk mengambil detail beasiswa berdasarkan UUID
    const fetchBeasiswaDetail = async (uuid) => {
        setError(null);
        try {
            console.log("Fetching detail for UUID:", uuid);
            const response = await axios.get(`${API_URL}/beasiswa/${uuid}`);
            console.log("Fetched detail data:", response.data);

            if (response.data) {
                // **Penting: Ubah path gambar menjadi URL lengkap untuk detail juga**
                const detailData = {
                    ...response.data,
                    img: response.data.img ? `${API_URL}${response.data.img}` : null
                };
                setSelectedCard(detailData);
                setPopupOpen(true);
            } else {
                console.warn("No data returned for detail:", uuid);
                setError("Detail beasiswa tidak ditemukan.");
            }
        } catch (err) {
            console.error(
                "Error fetching beasiswa detail:",
                err.response ? err.response.data : err.message
            );
            setError("Gagal mengambil detail beasiswa. Silakan coba lagi.");
            setSelectedCard(null);
            setPopupOpen(false);
        }
    };

    // --- Fungsi untuk menyimpan/membatalkan simpan beasiswa ---
    const handleToggleSaveScholarship = async (beasiswaUuid) => {
        if (!beasiswaUuid) return;

        const isCurrentlySaved = userSavedBeasiswa.includes(beasiswaUuid);
        const method = isCurrentlySaved ? "delete" : "post";
        const url = `${API_URL}/users/saved-beasiswa`;

        try {
            if (method === "post") {
                await axios.post(url, { beasiswa_uuid: beasiswaUuid });
                setUserSavedBeasiswa([...userSavedBeasiswa, beasiswaUuid]); // Tambahkan ke daftar yang disimpan
                setShowSavedPopup(true); // Tampilkan popup "Beasiswa Tersimpan"
            } else { // method === "delete"
                await axios.delete(url, { data: { beasiswa_uuid: beasiswaUuid } }); // DELETE dengan body memerlukan `data`
                setUserSavedBeasiswa(userSavedBeasiswa.filter(id => id !== beasiswaUuid)); // Hapus dari daftar
                setShowSavedPopup(false); // Opsional: mungkin tidak perlu popup untuk batal simpan
                alert("Beasiswa berhasil dibatalkan dari daftar tersimpan."); // Atau notifikasi lain
            }
            // Setelah aksi simpan/batal simpan, tutup popup detail
            setPopupOpen(false);

        } catch (err) {
            console.error(
                "Error toggling scholarship save status:",
                err.response ? err.response.data : err.message
            );
            if (err.response && err.response.status === 401) {
                alert("Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali.");
                navigate("/login"); // Redirect ke halaman login
            } else {
                alert("Gagal memperbarui status simpan beasiswa. Silakan coba lagi.");
            }
        }
    };

    // useEffect untuk memanggil fetchFilteredBeasiswa dan fetchUserSavedBeasiswa
    useEffect(() => {
        if (location.state && JSON.stringify(location.state) !== JSON.stringify(filters)) {
            setFilters(location.state);
        }
        fetchFilteredBeasiswa(filters);
        fetchUserSavedBeasiswa(); // Ambil daftar beasiswa yang disimpan
    }, [filters, location.state]);

    // Handler saat kartu beasiswa diklik
    const handleCardClick = (card) => {
        if (card && card.uuid) {
            fetchBeasiswaDetail(card.uuid);
        } else {
            console.error("Card or card.uuid is undefined:", card);
        }
    };

    // Tentukan apakah beasiswa saat ini (selectedCard) sudah tersimpan
    const isSelectedCardSaved = selectedCard ? userSavedBeasiswa.includes(selectedCard.uuid) : false;


    // Efek untuk menyembunyikan PopupSaved setelah beberapa detik
    useEffect(() => {
        if (showSavedPopup) {
            const timer = setTimeout(() => setShowSavedPopup(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSavedPopup]);

    return (
        <>
            <Header />
            <main>
                <section
                    className="h-[450px] flex items-stretch"
                    style={{ background: "linear-gradient(to right, #0d1d33, #265899)" }}
                >
                    <div className="max-w-6xl mx-auto px-4 w-full flex items-stretch">
                        <div className="flex-1 flex flex-col justify-center text-white">
                            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                                Rekomendasi{" "}
                                <span className="text-[#dda853] italic">Beasiswa</span>
                                <br />
                                Untuk Anda!
                            </h1>
                        </div>
                        <div className="flex-1 flex items-end justify-center md:justify-end">
                            <img
                                src="/img/scholarshiphub/Banner.png"
                                alt="Rekomendasi Beasiswa"
                                className="max-h-full object-contain self-end w-full max-w-sm"
                            />
                        </div>
                    </div>
                </section>

                <section className="mt-12 mb-12 ml-8">
                    <a
                        href="/scholarshiphub"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#3375CC] hover:bg-[#295ea3] text-white text-sm font-semibold rounded"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Kembali
                    </a>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full px-8 mb-20">
                    {loading && (
                        <p className="col-span-full text-center text-gray-500">
                            Memuat beasiswa rekomendasi...
                        </p>
                    )}
                    {error && (
                        <p className="col-span-full text-center text-red-500">{error}</p>
                    )}
                    {!loading && !error && beasiswaData.length > 0 ? (
                        beasiswaData.map((item) => (
                            <Card key={item.uuid} {...item} onClick={() => handleCardClick(item)} />
                        ))
                    ) : (
                        !loading && !error && (
                            <p className="col-span-full text-center text-gray-500">
                                Tidak ada program yang sesuai dengan filter.
                            </p>
                        )
                    )}
                </section>

                <PopupDetail
                    show={popupOpen}
                    onClose={() => setPopupOpen(false)}
                    data={selectedCard}
                    isSaved={isSelectedCardSaved} // Meneruskan status tersimpan ke PopupDetail
                    onSave={() => selectedCard && handleToggleSaveScholarship(selectedCard.uuid)} // Panggil fungsi toggle
                />
                <PopupSaved show={showSavedPopup} onClose={() => setShowSavedPopup(false)} />
            </main>
            <Footer />
        </>
    );
};

export default Rekomendasi;