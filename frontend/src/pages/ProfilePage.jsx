// ProfilePage.jsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState, useRef, useEffect, useCallback } from "react"; // Tambahkan useCallback
import PersonalInfo from "../components/profile/PersonalInfo";
import Education from "../components/profile/Education";
import ParentData from "../components/profile/ParentData";
import Portfolio from "../components/profile/Portfolio";
import CareerGoals from "../components/profile/CareerGoals";
import Button from "../components/profile/ButtonProfile";
import Beasiswa from "../components/profile/Beasiswa";
import Kompetisi from "../components/profile/Kompetisi";
import AddCommunity from "../components/profile/AddCommunity";
import SavedCommunity from "../components/profile/SavedCommunity";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Pastikan API_BASE_URL didefinisikan di .env file di root project frontend Anda
// Contoh: VITE_APP_API_URL=http://localhost:5000 (untuk Vite)
const API_BASE_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:5000";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("PROFIL");
  // profileImage dan coverImage bisa disinkronkan langsung dari profileData.url_foto_profile/sampul
  // Ini membantu mengurangi duplikasi state dan menjaga single source of truth.
  // const [profileImage, setProfileImage] = useState(null); // Bisa dihapus
  // const [coverImage, setCoverImage] = useState(null);   // Bisa dihapus
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false); // State untuk update info profil
  const [isUploadingProfile, setIsUploadingProfile] = useState(false); // State untuk upload foto profil
  const [isUploadingCover, setIsUploadingCover] = useState(false); // State untuk upload foto sampul


  // State untuk data profil dari BE
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    email: "",
    ttl: "",
    jenis_kelamin: "",
    alamat: "",
    no_telp: "",
    nama_institusi: "",
    prodi: "",
    fakultas: "",
    semester: "",
    ipk: 0.0,
    minat_bidang: "",
    rencana: "",
    motivator_karir: "",
    url_foto_profile: null,
    url_foto_sampul: null,
    orang_tua: {
      nama_ayah: "", ttl_ayah: "", alamat_ayah: "", no_telp_ayah: "",
      pendidikan_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "",
      nama_ibu: "", ttl_ibu: "", alamat_ibu: "", no_telp_ibu: "",
      pendidikan_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "",
    },
    // Jika ada field lain dari BE, tambahkan di sini juga
  });

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const navigate = useNavigate();

  // --- Fungsi untuk mengambil data profil saat komponen dimuat ---
  // Gunakan useCallback untuk memoize fungsi agar tidak dibuat ulang setiap render
  const getProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data utama dan data orang tua secara paralel jika memungkinkan,
      // atau tangani secara berurutan dengan try-catch terpisah seperti yang sudah Anda lakukan.
      // Pendekatan Anda saat ini untuk orang tua sudah cukup baik untuk fallback.

      const profileRes = await axios.get(`${API_BASE_URL}/profile`, {
        withCredentials: true,
      });
      const profileDataFromBE = profileRes.data;

      let orangTuaDataFromBE = {};
      try {
        const orangTuaRes = await axios.get(`${API_BASE_URL}/orangtua`, {
          withCredentials: true,
        });
        orangTuaDataFromBE = orangTuaRes.data;
      } catch (orangTuaFetchError) {
        console.warn("Error fetching parent data (might not exist yet):", orangTuaFetchError);
        // Fallback ke objek kosong jika tidak ditemukan
        orangTuaDataFromBE = {
          nama_ayah: "", ttl_ayah: "", alamat_ayah: "", no_telp_ayah: "",
          pendidikan_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "",
          nama_ibu: "", ttl_ibu: "", alamat_ibu: "", no_telp_ibu: "",
          pendidikan_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "",
        };
      }

      // Gabungkan semua data dengan nilai default yang aman
      setProfileData({
        name: profileDataFromBE.name || "",
        bio: profileDataFromBE.bio || "",
        email: profileDataFromBE.email || "",
        ttl: profileDataFromBE.ttl || "",
        jenis_kelamin: profileDataFromBE.jenis_kelamin || "",
        alamat: profileDataFromBE.alamat || "",
        no_telp: profileDataFromBE.no_telp || "",
        nama_institusi: profileDataFromBE.nama_institusi || "",
        prodi: profileDataFromBE.prodi || "",
        fakultas: profileDataFromBE.fakultas || "",
        semester: profileDataFromBE.semester || "",
        ipk: profileDataFromBE.ipk !== null && profileDataFromBE.ipk !== undefined ? profileDataFromBE.ipk : 0.0,
        minat_bidang: profileDataFromBE.minat_bidang || "",
        rencana: profileDataFromBE.rencana || "",
        motivator_karir: profileDataFromBE.motivator_karir || "",
        url_foto_profile: profileDataFromBE.url_foto_profile || null,
        url_foto_sampul: profileDataFromBE.url_foto_sampul || null,
        orang_tua: {
          nama_ayah: orangTuaDataFromBE.nama_ayah || "",
          ttl_ayah: orangTuaDataFromBE.ttl_ayah || "",
          alamat_ayah: orangTuaDataFromBE.alamat_ayah || "",
          no_telp_ayah: orangTuaDataFromBE.no_telp_ayah || "",
          pendidikan_ayah: orangTuaDataFromBE.pendidikan_ayah || "",
          pekerjaan_ayah: orangTuaDataFromBE.pekerjaan_ayah || "",
          penghasilan_ayah: orangTuaDataFromBE.penghasilan_ayah || "",
          nama_ibu: orangTuaDataFromBE.nama_ibu || "",
          ttl_ibu: orangTuaDataFromBE.ttl_ibu || "",
          alamat_ibu: orangTuaDataFromBE.alamat_ibu || "",
          no_telp_ibu: orangTuaDataFromBE.no_telp_ibu || "",
          pendidikan_ibu: orangTuaDataFromBE.pendidikan_ibu || "",
          pekerjaan_ibu: orangTuaDataFromBE.pekerjaan_ibu || "",
          penghasilan_ibu: orangTuaDataFromBE.penghasilan_ibu || "",
        },
      });

      // Sinkronkan state lokal untuk nama dan bio dari profileData yang baru diterima
      setName(profileDataFromBE.name || "");
      setBio(profileDataFromBE.bio || "");
      // Tidak perlu setProfileImage/setCoverImage secara terpisah jika mereka diambil dari profileData
      // setProfileImage(profileDataFromBE.url_foto_profile || null);
      // setCoverImage(profileDataFromBE.url_foto_sampul || null);

    } catch (error) {
      console.error("Error fetching main profile data:", error);
      setError(error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
      // Pastikan semua state diset ke default jika fetch gagal
      setProfileData({
        name: "", bio: "", email: "", ttl: "", jenis_kelamin: "", alamat: "", no_telp: "",
        nama_institusi: "", prodi: "", fakultas: "", semester: "", ipk: 0.0,
        minat_bidang: "", rencana: "", motivator_karir: "",
        url_foto_profile: null, url_foto_sampul: null,
        orang_tua: {
          nama_ayah: "", ttl_ayah: "", alamat_ayah: "", no_telp_ayah: "",
          pendidikan_ayah: "", pekerjaan_ayah: "", penghasilan_ayah: "",
          nama_ibu: "", ttl_ibu: "", alamat_ibu: "", no_telp_ibu: "",
          pendidikan_ibu: "", pekerjaan_ibu: "", penghasilan_ibu: "",
        },
      });
      setName("");
      setBio("");
      // setProfileImage(null); // Tidak perlu jika langsung dari profileData
      // setCoverImage(null);   // Tidak perlu jika langsung dari profileData
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Tambahkan `Maps` ke dependency array useCallback

  useEffect(() => {
    getProfileData();
  }, [getProfileData]); // Tambahkan `getProfileData` ke dependency array useEffect

  // --- Fungsi untuk memperbarui semua informasi profil (termasuk orang tua) ---
  const handleUpdateProfileInfo = async () => {
    // Hanya panggil update jika tidak sedang dalam proses update
    if (isUpdating) return;

    setIsUpdating(true); // Set status updating
    try {
      // Pastikan menggunakan state 'name' dan 'bio' lokal
      const updatedProfileData = {
        ...profileData,
        name: name,
        bio: bio,
      };

      const { orang_tua, ...restProfileData } = updatedProfileData;

      delete restProfileData.url_foto_profile;
      delete restProfileData.url_foto_sampul;

      console.log("PAYLOAD KE BACKEND (Profil Utama):", restProfileData);

      await axios.patch(`${API_BASE_URL}/profile`, restProfileData, {
        withCredentials: true,
      });

      console.log("PAYLOAD KE BACKEND (Orang Tua):", orang_tua);

      try {
        await axios.patch(`${API_BASE_URL}/orangtua`, orang_tua, {
          withCredentials: true,
        });
      } catch (orangTuaError) {
        if (orangTuaError.response && orangTuaError.response.status === 404) {
          console.log("Data orang tua belum ada, melakukan POST (create).");
          await axios.post(`${API_BASE_URL}/orangtua`, orang_tua, {
            withCredentials: true,
          });
        } else {
          console.error("Error updating/creating parent data:", orangTuaError);
          throw orangTuaError;
        }
      }

      alert("Profil berhasil diperbarui!");
      getProfileData(); // Refresh data setelah update berhasil
    } catch (error) {
      console.error("Error updating profile info:", error);
      alert(
        "Gagal memperbarui profil: " + (error.response?.data?.msg || error.message)
      );
    } finally {
      setIsUpdating(false); // Reset status updating
    }
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/logout`, { withCredentials: true });
      navigate("/login");
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Gagal logout. Silakan coba lagi.");
    }
  };

  const handleBack = () => {
    navigate("/landingpage");
  };

  // --- Fungsi untuk mengunggah foto profil ---
  const handleProfileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (isUploadingProfile) return; // Jangan izinkan upload ganda
      setIsUploadingProfile(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          `${API_BASE_URL}/profile/upload/profile-picture`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
        // Langsung update profileData, bukan state profileImage terpisah
        setProfileData((prevData) => ({
          ...prevData,
          url_foto_profile: response.data.url_foto_profile,
        }));
        alert("Foto profil berhasil diunggah!");
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert(
          "Gagal mengunggah foto profil: " +
            (error.response?.data?.msg || error.message)
        );
      } finally {
        setIsUploadingProfile(false);
      }
    }
    e.target.value = null;
  };

  // --- Fungsi untuk menghapus foto profil ---
  const handleProfileDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/profile/data/delete-picture`, {
        withCredentials: true,
      });
      // Update profileData setelah penghapusan
      setProfileData((prevData) => ({
        ...prevData,
        url_foto_profile: null,
      }));
      if (profileInputRef.current) profileInputRef.current.value = null;
      alert("Foto profil berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      alert(
        "Gagal menghapus foto profil: " +
          (error.response?.data?.msg || error.message)
      );
    }
  };

  // --- Fungsi untuk mengunggah foto sampul ---
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (isUploadingCover) return; // Jangan izinkan upload ganda
      setIsUploadingCover(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          `${API_BASE_URL}/profile/upload/cover-picture`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
        // Langsung update profileData, bukan state coverImage terpisah
        setProfileData((prevData) => ({
          ...prevData,
          url_foto_sampul: response.data.url_foto_sampul,
        }));
        alert("Foto sampul berhasil diunggah!");
      } catch (error) {
        console.error("Error uploading cover picture:", error);
        alert(
          "Gagal mengunggah foto sampul: " +
            (error.response?.data?.msg || error.message)
        );
      } finally {
        setIsUploadingCover(false);
      }
    }
    e.target.value = null;
  };

  // --- Fungsi untuk menghapus foto sampul ---
  const handleCoverDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/profile/data/delete-cover-picture`, {
        withCredentials: true,
      });
      // Update profileData setelah penghapusan
      setProfileData((prevData) => ({
        ...prevData,
        url_foto_sampul: null,
      }));
      if (coverInputRef.current) coverInputRef.current.value = null;
      alert("Foto sampul berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting cover picture:", error);
      alert(
        "Gagal menghapus foto sampul: " +
          (error.response?.data?.msg || error.message)
      );
    }
  };

  // Render kondisi loading dan error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F9]">
        <p className="text-gray-700">Memuat profil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7F9] text-red-500">
        <p className="mb-4">Terjadi kesalahan saat memuat profil:</p>
        <p className="mb-4">{error.message}</p>
        <p className="text-sm text-gray-600">Mohon coba refresh halaman atau hubungi administrator.</p>
        <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg"
        >
            Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Cover Image */}
      <div className="relative w-full">
        <div className="w-full h-[316px] overflow-hidden relative">
          <img
            src={profileData.url_foto_sampul || "/img/profile/default_cover.png"}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex space-x-2">
            <label className={`bg-white p-2 rounded-full shadow cursor-pointer ${isUploadingCover ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <FaEdit className="text-gray-600" />
              <input
                type="file"
                accept="image/*"
                ref={coverInputRef}
                onChange={handleCoverChange}
                className="hidden"
                disabled={isUploadingCover}
              />
            </label>
            {profileData.url_foto_sampul && (
              <button
                onClick={handleCoverDelete}
                className="bg-white p-2 rounded-full shadow text-red-500"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>

        {/* Profile Image & Info */}
        <div className="container mx-auto px-4 relative">
          <div className="absolute left-[98px] top-[-100px]">
            <div className="relative">
              <img
                src={profileData.url_foto_profile || "/img/profile/default_profile.jpg"}
                alt="Profile"
                className="w-[200px] h-[200px] rounded-full border-4 border-white object-cover"
              />
              <div className="absolute bottom-2 right-2 flex space-x-1">
                <label className={`bg-white p-1 rounded-full shadow cursor-pointer ${isUploadingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <FaEdit className="text-gray-600 text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    ref={profileInputRef}
                    onChange={handleProfileChange}
                    className="hidden"
                    disabled={isUploadingProfile}
                  />
                </label>
                {profileData.url_foto_profile && (
                  <button
                    onClick={handleProfileDelete}
                    className="bg-white p-1 rounded-full shadow text-red-500"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 pl-[359px] flex justify-between items-start">
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                placeholder="Masukkan nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleUpdateProfileInfo}
                className="text-[31px] font-bold font-poppins text-black bg-transparent focus:outline-none"
                disabled={isUpdating} // Disable input saat update
              />
              <textarea
                placeholder="Masukkan bio Anda"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={handleUpdateProfileInfo}
                className="text-lg font-poppins text-black bg-transparent resize-none focus:outline-none"
                disabled={isUpdating} // Disable textarea saat update
              />
            </div>

            <div className="flex gap-5">
              <Button
                onClick={handleBack}
                className="bg-[#3375cc] text-white font-bold py-2 px-4 rounded-lg"
              >
                Kembali
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-[#ff3037] text-white font-bold py-2 px-4 rounded-lg"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#ebf1fa] rounded-t-[22px] mt-10 mx-auto w-[1150px] pb-10">
        <div className="flex flex-col items-center">
          <div className="pt-6">
            <img
              src="/img/profile/Ellipse_1-removebg-preview.png"
              alt="EduRise"
              className="w-[84px] h-[84px] rounded-full"
            />
          </div>

          <div className="flex justify-center gap-10 py-10">
            {["PROFIL", "TERSIMPAN", "KOMUNITAS"].map((tab) => (
              <button
                key={tab}
                className={`text-sm font-poppins ${
                  activeTab === tab
                    ? "font-bold text-[#295ea3] underline"
                    : "font-semibold text-[#575858]"
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-full max-w-5xl px-7">
            {activeTab === "PROFIL" && (
              <>
                <PersonalInfo
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onUpdate={handleUpdateProfileInfo} // Pastikan PersonalInfo memanggil onUpdate
                />
                <Education
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onUpdate={handleUpdateProfileInfo} // Pastikan Education memanggil onUpdate
                />
                <ParentData
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onUpdate={handleUpdateProfileInfo} // Pastikan ParentData memanggil onUpdate
                />
                <Portfolio
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onUpdate={handleUpdateProfileInfo} // Pastikan Portfolio memanggil onUpdate
                />
                <CareerGoals
                  profileData={profileData}
                  setProfileData={setProfileData}
                  onUpdate={handleUpdateProfileInfo} // Pastikan CareerGoals memanggil onUpdate
                />
              </>
            )}
            {activeTab === "TERSIMPAN" && (
              <>
                <Beasiswa />
                <Kompetisi />
              </>
            )}
            {activeTab === "KOMUNITAS" && (
              <>
                <AddCommunity />
                <SavedCommunity />
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- Pop-up Konfirmasi Logout (Efek Kaca Buram) --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-blue bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div
            className="p-8 rounded-xl shadow-2xl max-w-sm w-full text-center border border-gray-200 transform scale-95 animate-scaleIn"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 font-poppins">
              Konfirmasi Logout
            </h3>
            <p className="text-gray-600 mb-6 font-poppins">
              Apakah Anda yakin ingin keluar dari akun ini?
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleConfirmLogout}
                className="bg-green-500 text-white font-bold py-4 px-2 rounded-lg hover:bg-green-600 transition duration-300 transform hover:scale-105"
              >
                Ya, Logout
              </Button>
              <Button
                onClick={() => setShowLogoutModal(false)}
                className="bg-red-500 text-white font-bold py-4 px-2 rounded-lg hover:bg-red-600 transition duration-300 transform hover:scale-105"
              >
                Tidak, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* --- Akhir Pop-up Konfirmasi Logout --- */}
      <Footer />
    </div>
  );
};

export default ProfilePage;