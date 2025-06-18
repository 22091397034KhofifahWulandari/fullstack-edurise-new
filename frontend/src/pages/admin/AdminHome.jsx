import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LayoutDashboard, Edit, Trash, Plus, AlertTriangle, Frown, Eye, Goal, Speech, UserSearch, ClipboardCheck, Loader } from 'lucide-react';
import axios from 'axios';

// GANTI BARIS INI
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL; 

const AdminHome = () => {
  const navigate = useNavigate();

  // State for managing users data
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false); // Renamed from showForm
  const [userFormData, setUserFormData] = useState({ name: '', email: '', status: '' }); // Renamed from formData

  // State for managing beasiswa data
  const [beasiswas, setBeasiswas] = useState([]);
  const [showBeasiswaForm, setShowBeasiswaForm] = useState(false); // New state for beasiswa form visibility
  const [isEditBeasiswaMode, setIsEditBeasiswaMode] = useState(false); // New state for beasiswa edit mode
  const [selectedBeasiswa, setSelectedBeasiswa] = useState(null); // New state for selected beasiswa
  const [beasiswaImageFile, setBeasiswaImageFile] = useState(null); // State for selected image file for beasiswa
  const [previewBeasiswaImg, setPreviewBeasiswaImg] = useState(null); // State for image preview for beasiswa
  const beasiswaFormRef = useRef(null); // Ref for beasiswa form
  const [beasiswaMsg, setBeasiswaMsg] = useState(""); // Message for beasiswa operations

  const [beasiswaFormData, setBeasiswaFormData] = useState({ // New state for beasiswa form data
    title: '',
    penyelenggara: '',
    description: '',
    detail: '',
    kategori: '',
    jenjang: '',
    lokasi: '',
    link: '',
    deadline: '',
    imgUrl: '', // For displaying existing image URL
    currentImgName: '' // For backend to know existing image
  });

  // State for total scholarships (count)
  const [totalScholarships, setTotalScholarships] = useState(0);

  // State for total mentoring sessions
  const [totalMentoringSessions, setTotalMentoringSessions] = useState(0);

  // State for total competitions
  const [totalCompetitions, setTotalCompetitions] = useState(0);

  // Add state for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // To store which item (user/beasiswa) to delete

  const [loading, setLoading] = useState(false); // Loading state for API calls

  // Set base URL for axios (if not already set globally)
  // BARIS INI SUDAH TEPAT, TAPI JIKA INGIN LEBIH EKSPLISIT DI SETIAP PANGGILAN, BISA JUGA
  axios.defaults.baseURL = API_BASE_URL; //

  // --- Fetch Data on Component Mount ---
  useEffect(() => {
    fetchTotalScholarships();
    fetchUsers();
    fetchTotalMentoringSessions();
    fetchTotalCompetitions();
    getBeasiswas(); // Fetch beasiswa data when component mounts
  }, []);

  const fetchTotalScholarships = async () => {
    try {
      const response = await axios.get('/beasiswa');
      setTotalScholarships(response.data.length);
    } catch (error) {
      console.error("Error fetching total scholarships:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTotalMentoringSessions = async () => {
    try {
      const response = await axios.get('/mentoring');
      setTotalMentoringSessions(response.data.length);
    } catch (error) {
      console.error("Error fetching total mentoring sessions:", error);
    }
  };

  const fetchTotalCompetitions = async () => {
    try {
      const response = await axios.get('/kompetisi');
      setTotalCompetitions(response.data.length);
    } catch (error) {
      console.error("Error fetching total competitions:", error);
    }
  };

  // --- User Management Handlers ---
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: value
    });
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setUserFormData({ name: '', email: '', status: '' });
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      status: user.role
    });
    setShowUserForm(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading for user form submission

    try {
      if (selectedUser) {
        await axios.patch(`${API_BASE_URL}/users/${selectedUser.uuid}`, {
          name: userFormData.name,
          email: userFormData.email,
          role: userFormData.status
        });
      } else {
        await axios.post(`${API_BASE_URL}/users`, {
          name: userFormData.name,
          email: userFormData.email,
          password: 'defaultpassword', // Placeholder, handle securely in real app
          confPassword: 'defaultpassword',
          role: userFormData.status
        });
      }
      setShowUserForm(false);
      setSelectedUser(null);
      setUserFormData({ name: '', email: '', status: '' });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error submitting user form:", error);
      // Handle error, e.g., show an error message
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleDeleteUser = (user) => {
    setItemToDelete({ type: 'user', id: user.uuid, name: user.name });
    setShowDeleteModal(true);
  };

  // --- Beasiswa Management Handlers ---
  const getBeasiswas = async () => {
    setLoading(true);
    setBeasiswaMsg(""); // Clear previous messages
    try {
      const response = await axios.get(`${API_BASE_URL}/beasiswa`);
      const formattedData = response.data.map(b => ({
        id: b.uuid,
        title: b.title,
        penyelenggara: b.penyelenggara,
        description: b.description,
        detail: b.detail,
        kategori: b.kategori,
        jenjang: b.jenjang,
        lokasi: b.lokasi,
        link: b.link,
        deadline: b.deadline && !isNaN(new Date(b.deadline))
          ? new Date(b.deadline).toISOString().split('T')[0]
          : '',
        imgUrl: b.img ? `${API_BASE_URL}${b.img}` : null,
        currentImgName: b.img,
      }));
      setBeasiswas(formattedData);
      setTotalScholarships(formattedData.length); // Update total scholarships count
    } catch (error) {
      console.error("Error fetching beasiswas:", error);
      setBeasiswaMsg(`Error fetching data: ${error.response?.data?.msg || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBeasiswaInputChange = (e) => {
    const { name, value } = e.target;
    setBeasiswaFormData({ ...beasiswaFormData, [name]: value });
  };

  const handleBeasiswaFileChange = (e) => {
    const file = e.target.files[0];
    setBeasiswaImageFile(file);
    if (file) {
      setPreviewBeasiswaImg(URL.createObjectURL(file));
    } else {
      setPreviewBeasiswaImg(null);
    }
  };

  const handleBeasiswaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBeasiswaMsg("");

    const data = new FormData();
    for (const key in beasiswaFormData) {
      if (key !== 'imgUrl' && key !== 'currentImgName') {
        data.append(key, beasiswaFormData[key]);
      }
    }

    if (beasiswaImageFile) {
      data.append('img', beasiswaImageFile);
    } else if (isEditBeasiswaMode && beasiswaFormData.currentImgName) {
      data.append('existingImg', beasiswaFormData.currentImgName);
    } else if (isEditBeasiswaMode && !beasiswaImageFile && !beasiswaFormData.currentImgName && previewBeasiswaImg) {
      data.append('removeImg', 'true');
    }

    try {
      if (isEditBeasiswaMode) {
        await axios.patch(`${API_BASE_URL}/beasiswa/${selectedBeasiswa.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setBeasiswaMsg("Beasiswa berhasil diperbarui!");
      } else {
        if (!beasiswaImageFile) {
          setBeasiswaMsg("Gambar beasiswa wajib diisi untuk penambahan baru.");
          setLoading(false);
          return;
        }
        await axios.post(`${API_BASE_URL}/beasiswa`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setBeasiswaMsg("Beasiswa berhasil ditambahkan!");
      }
      setShowBeasiswaForm(false);
      resetBeasiswaForm();
      getBeasiswas();
    } catch (error) {
      console.error("Error submitting beasiswa form:", error);
      if (error.response) {
        setBeasiswaMsg(error.response.data.msg || "Terjadi kesalahan saat menyimpan beasiswa.");
      } else {
        setBeasiswaMsg("Terjadi kesalahan jaringan atau server tidak merespon.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeasiswaClick = () => {
    resetBeasiswaForm();
    setShowBeasiswaForm(true);
  };

  const handleEditBeasiswa = (beasiswa) => {
    setIsEditBeasiswaMode(true);
    setSelectedBeasiswa(beasiswa);
    setBeasiswaFormData({
      title: beasiswa.title,
      penyelenggara: beasiswa.penyelenggara,
      description: beasiswa.description,
      detail: beasiswa.detail,
      kategori: beasiswa.kategori,
      jenjang: beasiswa.jenjang,
      lokasi: beasiswa.lokasi,
      link: beasiswa.link,
      deadline: beasiswa.deadline,
      imgUrl: beasiswa.imgUrl,
      currentImgName: beasiswa.currentImgName,
    });
    setPreviewBeasiswaImg(beasiswa.imgUrl);
    setBeasiswaImageFile(null);
    setBeasiswaMsg("");
    setShowBeasiswaForm(true);
  };

  const handleDeleteBeasiswa = (beasiswa) => {
    setItemToDelete({ type: 'beasiswa', id: beasiswa.id, name: beasiswa.title });
    setShowDeleteModal(true);
  };

  const resetBeasiswaForm = () => {
    setBeasiswaFormData({
      title: '',
      penyelenggara: '',
      description: '',
      detail: '',
      kategori: '',
      jenjang: '',
      lokasi: '',
      link: '',
      deadline: '',
      imgUrl: '',
      currentImgName: '',
    });
    setBeasiswaImageFile(null);
    setPreviewBeasiswaImg(null);
    setIsEditBeasiswaMode(false);
    setSelectedBeasiswa(null);
    setBeasiswaMsg("");
  };

  // --- Generic Delete Confirmation Handlers ---
  const confirmDelete = async () => {
    setLoading(true);
    setBeasiswaMsg(""); // Clear messages for beasiswa section
    try {
      if (itemToDelete) {
        if (itemToDelete.type === 'user') {
          await axios.delete(`${API_BASE_URL}/users/${itemToDelete.id}`);
          fetchUsers(); // Refresh user list
        } else if (itemToDelete.type === 'beasiswa') {
          await axios.delete(`${API_BASE_URL}/beasiswa/${itemToDelete.id}`);
          getBeasiswas(); // Refresh beasiswa list
        }
        setBeasiswaMsg(`${itemToDelete.name} berhasil dihapus!`);
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error(`Error deleting ${itemToDelete?.type}:`, error);
      setBeasiswaMsg(`Error deleting data: ${error.response?.data?.msg || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  return (
    <div className="grid grid-cols-[250px_1fr] min-h-screen">
      {/* Top header bar */}
      <header className="col-span-2 bg-white h-[60px] px-5 shadow-md fixed top-0 left-0 right-0 z-50 flex items-center">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
            <div className="rounded-full overflow-hidden flex items-center justify-center mr-3">
              <img src="/img/eduriselanding/Ellipse 1.png" alt="EduRise Logo" className="w-[40px] h-[40px] object-contain" />
            </div>
            <h4 className="m-0 italic font-bold ml-2"><span className="text-[#3375cc]">EDU</span><span className="text-[#dda853]">RISE</span> ADMIN</h4>
          </div>
          <Link to="/data-admin" className="w-8 h-8 rounded-full bg-[#3375CC] text-white flex items-center justify-center">
            <User size={24} />
          </Link>
        </div>
      </header>

      {/* Sidebar navigation */}
      <nav className="bg-[#1e3a8a] text-white p-6 pt-[10px] fixed top-0 left-0 h-screen w-[250px] overflow-y-auto z-40">
        <div className="space-y-6 text-white">
          {/* Main Menu Group */}
          <div>
            <h5 className="text-sm uppercase font-bold !text-white mb-3 px-2">Dashboard</h5>
            <ul className="space-y-1.5">
              <li>
                <Link to="/data-admin" className="flex items-center !text-white py-2.5 px-3 rounded-lg bg-[#3375CC] hover:bg-[#2d4fc7] transition-colors">
                  <LayoutDashboard className="w-5 h-5 mr-3 text-white" />
                  <span className="!text-white">Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Group */}
          <div>
            <h5 className="text-sm uppercase font-bold !text-white mb-3 px-2">Layanan</h5>
            <ul className="space-y-1.5">
              <li>
                <Link to="/beasiswa-management" className="flex items-center !text-white py-2.5 px-3 rounded-lg hover:bg-[#2d4fc7] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <span className="!text-white">Scholarship Hub</span>
                </Link>
              </li>
              <li>
                <a href="/penilaian-management" className="flex items-center !text-white py-2.5 px-3 rounded-lg hover:bg-[#2d4fc7] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  <span className="!text-white">Eduprep Tools</span>
                </a>
              </li>
              <li>
                <a href="/webinar-admin" className="flex items-center !text-white py-2.5 px-3 rounded-lg hover:bg-[#2d4fc7] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  <span className="!text-white">Edu Academy</span>
                </a>
              </li>
              <li>
                <a href="/kompetisi-management" className="flex items-center !text-white py-2.5 px-3 rounded-lg hover:bg-[#2d4fc7] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="!text-white">Edu Event</span>
                </a>
              </li>
              <li>
                <a href="/forum-management" className="flex items-center !text-white py-2.5 px-3 rounded-lg hover:bg-[#2d4fc7] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="!text-white">Edu Connect</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Settings Group */}
          <div>
            <h5 className="text-sm uppercase font-bold !text-white mb-3 px-2">Pengaturan</h5>
            <ul className="space-y-1.5">
              <li>
                <Link to="/user-management" className="flex items-center !text-white py-2.5 px-3 rounded-lg hover:bg-[#2d4fc7] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="!text-white">User Settings</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="col-start-2 ml-[10px] mt-[60px] p-5 bg-[#f9fafb] min-h-[calc(100vh-60px)]">
        {/* Statistic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded shadow-sm">
            <div className="p-4 text-center">
              <h6 className="text-sm font-medium mb-1">Total Scholarship</h6>
              <h4 className="text-xl font-semibold">{totalScholarships}</h4>
            </div>
          </div>
          <div className="bg-white rounded shadow-sm">
            <div className="p-4 text-center">
              <h6 className="text-sm font-medium mb-1">Total Kompetisi</h6>
              <h4 className="text-xl font-semibold">{totalCompetitions}</h4>
            </div>
          </div>
          <div className="bg-white rounded shadow-sm">
            <div className="p-4 text-center">
              <h6 className="text-sm font-medium mb-1">Total Users</h6>
              <h4 className="text-xl font-semibold">{users.length}</h4>
            </div>
          </div>
          <div className="bg-white rounded shadow-sm">
            <div className="p-4 text-center">
              <h6 className="text-sm font-medium mb-1">Total Mentor</h6>
              <h4 className="text-xl font-semibold">{totalMentoringSessions}</h4>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
          <Link to="/user-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <User className="text-blue-500" />
              <h2 className="text-lg font-semibold">Manajemen User</h2>
            </div>
          </Link>

          <Link to="/artikel-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Edit className="text-green-500" />
              <h2 className="text-lg font-semibold">Manajemen Artikel</h2>
            </div>
          </Link>

          <Link to="/beasiswa-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="text-purple-500" />
              <h2 className="text-lg font-semibold">Manajemen Beasiswa</h2>
            </div>
          </Link>

          <Link to="/penilaian-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="text-green-500" />
              <h2 className="text-lg font-semibold">Manajemen Penilaian</h2>
            </div>
          </Link>

          <Link to="/kompetisi-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Goal className="text-red-500" />
              <h2 className="text-lg font-semibold">Manajemen Kompetisi</h2>
            </div>
          </Link>

          <Link to="/kompetisi-registration-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Goal className="text-red-500" />
              <h2 className="text-lg font-semibold">Manajemen Registrasi Kompetisi</h2>
            </div>
          </Link>

          <Link to="/forum-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Eye className="text-yellow-500" />
              <h2 className="text-lg font-semibold">Manajemen Forum</h2>
            </div>
          </Link>

          <Link to="/mentoring-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Speech className="text-orange-500" />
              <h2 className="text-lg font-semibold">Manajemen Mentoring</h2>
            </div>
          </Link>

          <Link to="/diskusi-management" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
             <div className="flex items-center gap-2">
              <UserSearch className="text-red-500" />
              <h2 className="text-lg font-semibold">Manajemen Diskusi</h2>
            </div>
          </Link>

          <Link to="/webinar-admin" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Eye className="text-yellow-500" />
              <h2 className="text-lg font-semibold">Manajemen Webinar</h2>
            </div>
          </Link>

          <Link to="/admin/webinar-peserta" className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Eye className="text-yellow-500" />
              <h2 className="text-lg font-semibold">Manajemen Peserta Webinar</h2>
            </div>
          </Link>
        </div>

        {/* Data User Table */}
        <section className="mb-5">
          <div className="bg-white rounded shadow-sm">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <strong>Data User</strong>
              <button
                className="px-2.5 py-1 text-sm bg-[#3375CC] hover:bg-[#295ea3] text-white rounded flex items-center"
                onClick={handleAddUser}
              >
                <Plus size={16} className="mr-1" />
                Tambah User
              </button>
            </div>
            <div className="p-4">
              <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-200" role="alert">
                ⚠️ Selalu Periksa Status Beasiswa dari Tiap User, dan Teliti Saat Merubah Data!
              </div>

              {/* Form for adding/editing user */}
              {showUserForm && (
                <div className="mb-3 bg-white rounded shadow-sm">
                  <div className="p-4 bg-gray-50 border-b">
                    <strong>{selectedUser ? 'Edit User' : 'Tambah User'}</strong>
                  </div>
                  <div className="p-4">
                    <form onSubmit={handleUserSubmit}>
                      <div className="mb-3">
                        <label htmlFor="name" className="block mb-1 font-medium">Nama/Username</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                          id="name"
                          name="name"
                          value={userFormData.name}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="email" className="block mb-1 font-medium">Email</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                          id="email"
                          name="email"
                          value={userFormData.email}
                          onChange={handleUserInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="status" className="block mb-1 font-medium">Role User</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                          id="status"
                          name="status"
                          value={userFormData.status}
                          onChange={handleUserInputChange}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="px-4 py-2 mr-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          onClick={() => setShowUserForm(false)}
                          disabled={loading}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#3375CC] hover:bg-[#295ea3] text-white rounded flex items-center justify-center"
                          disabled={loading}
                        >
                           {loading ? (
                                <>
                                    <Loader className="animate-spin mr-2" size={16} />
                                    {selectedUser ? 'Memperbarui...' : 'Menyimpan...'}
                                </>
                            ) : (
                                selectedUser ? 'Update' : 'Simpan'
                            )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Nama/Username</th>
                      <th className="border border-gray-300 p-2 text-left">Email</th>
                      <th className="border border-gray-300 p-2 text-left">Role</th>
                      <th className="border border-gray-300 p-2 text-left">Perubahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.uuid} className="border-b border-gray-300">
                        <td className="border border-gray-300 p-2">{user.name}</td>
                        <td className="border border-gray-300 p-2">{user.email}</td>
                        <td className="border border-gray-300 p-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${user.role === 'admin' ? 'bg-purple-500' :
                            user.role === 'mentor' ? 'bg-blue-500' : 'bg-gray-500' // Assuming 'user' is default
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-2">
                          <button
                            className="p-1 mr-1 bg-[#3375CC] text-white rounded hover:bg-[#295ea3]"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Manajemen Beasiswa Table */}
        <section className="mb-5">
          <div className="bg-white rounded shadow-sm">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <strong>Manajemen Beasiswa</strong>
              <button
                onClick={handleAddBeasiswaClick}
                className="px-2.5 py-1 text-sm bg-[#3375CC] hover:bg-[#295ea3] text-white rounded flex items-center"
              >
                <Plus size={16} className="mr-1" /> Tambah Beasiswa Baru
              </button>
            </div>

            <div className="p-4">
              {beasiswaMsg && (
                  <div className={`p-3 mb-4 rounded ${beasiswaMsg.includes("Error") ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {beasiswaMsg}
                  </div>
              )}

              {showBeasiswaForm ? (
                  <div className="mb-6">
                      <h2 className="text-2xl font-semibold mb-4">{isEditBeasiswaMode ? 'Edit Beasiswa' : 'Tambah Beasiswa Baru'}</h2>
                      <form onSubmit={handleBeasiswaSubmit} ref={beasiswaFormRef} className="space-y-4">
                          <div>
                              <label htmlFor="title" className="block text-gray-700 font-medium mb-1">Judul Beasiswa</label>
                              <input
                                  type="text"
                                  id="title"
                                  name="title"
                                  value={beasiswaFormData.title}
                                  onChange={handleBeasiswaInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              />
                          </div>
                          <div>
                              <label htmlFor="penyelenggara" className="block text-gray-700 font-medium mb-1">Penyelenggara</label>
                              <input
                                  type="text"
                                  id="penyelenggara"
                                  name="penyelenggara"
                                  value={beasiswaFormData.penyelenggara}
                                  onChange={handleBeasiswaInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              />
                          </div>
                          <div>
                              <label htmlFor="description" className="block text-gray-700 font-medium mb-1">Deskripsi Singkat</label>
                              <textarea
                                  id="description"
                                  name="description"
                                  value={beasiswaFormData.description}
                                  onChange={handleBeasiswaInputChange}
                                  rows="3"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              ></textarea>
                          </div>
                          <div>
                              <label htmlFor="detail" className="block text-gray-700 font-medium mb-1">Detail Lengkap (Markdown/HTML)</label>
                              <textarea
                                  id="detail"
                                  name="detail"
                                  value={beasiswaFormData.detail}
                                  onChange={handleBeasiswaInputChange}
                                  rows="5"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Anda bisa menggunakan format Markdown atau HTML di sini."
                              ></textarea>
                          </div>
                          <div>
                              <label htmlFor="kategori" className="block text-gray-700 font-medium mb-1">Kategori</label>
                              <select
                                  id="kategori"
                                  name="kategori"
                                  value={beasiswaFormData.kategori}
                                  onChange={handleBeasiswaInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              >
                                  <option value="">Pilih Kategori</option>
                                  <option value="Beasiswa">Beasiswa</option>
                                  <option value="Pelatihan">Pelatihan</option>
                              </select>
                          </div>
                          <div>
                              <label htmlFor="jenjang" className="block text-gray-700 font-medium mb-1">Jenjang</label>
                              <select
                                  id="jenjang"
                                  name="jenjang"
                                  value={beasiswaFormData.jenjang}
                                  onChange={handleBeasiswaInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              >
                                  <option value="">Pilih Jenjang</option>
                                  <option value="D3">D3</option>
                                  <option value="S1/D4">S1/D4</option>
                                  <option value="S2">S2</option>
                              </select>
                          </div>
                          <div>
                              <label htmlFor="lokasi" className="block text-gray-700 font-medium mb-1">Lokasi</label>
                              <select
                                  id="lokasi"
                                  name="lokasi"
                                  value={beasiswaFormData.lokasi}
                                  onChange={handleBeasiswaInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              >
                                  <option value="">Pilih Lokasi</option>
                                  <option value="DKI Jakarta">DKI Jakarta</option>
                                  <option value="Jawa Barat">Jawa Barat</option>
                                  <option value="Jawa Timur">Jawa Timur</option>
                              </select>
                          </div>
                          <div>
                              <label htmlFor="link" className="block text-gray-700 font-medium mb-1">Link Pendaftaran</label>
                              <input
                                  type="url"
                                  id="link"
                                  name="link"
                                  value={beasiswaFormData.link}
                                  onChange={handleBeasiswaInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              />
                          </div>
                          <div>
                              <label htmlFor="deadline" className="block text-gray-700 font-medium mb-1">Batas Waktu Pendaftaran</label>
                              <input
                                  type="date"
                                  id="deadline"
                                  name="deadline"
                                  value={beasiswaFormData.deadline}
                                  onChange={handleBeasiswaInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                              />
                          </div>
                          <div>
                              <label htmlFor="image" className="block text-gray-700 font-medium mb-1">Gambar Beasiswa</label>
                              <input
                                  type="file"
                                  id="image"
                                  name="image"
                                  accept="image/*"
                                  onChange={handleBeasiswaFileChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required={!isEditBeasiswaMode && !beasiswaFormData.currentImgName && !beasiswaImageFile}
                              />
                              {previewBeasiswaImg && (
                                  <div className="mt-2">
                                      <img src={previewBeasiswaImg} alt="Preview" className="max-w-xs h-auto rounded-md shadow" />
                                  </div>
                              )}
                              {isEditBeasiswaMode && !previewBeasiswaImg && beasiswaFormData.imgUrl && (
                                  <div className="mt-2 text-gray-600 text-sm">
                                      Gambar saat ini: <a href={beasiswaFormData.imgUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{beasiswaFormData.currentImgName || "gambar lama"}</a>
                                  </div>
                              )}
                          </div>

                          <div className="flex justify-end space-x-3">
                              <button
                                  type="button"
                                  onClick={() => { setShowBeasiswaForm(false); resetBeasiswaForm(); }}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                  disabled={loading}
                              >
                                  Batal
                              </button>
                              <button
                                  type="submit"
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                                  disabled={loading}
                              >
                                  {loading ? (
                                      <>
                                          <Loader className="animate-spin mr-2" size={20} />
                                          {isEditBeasiswaMode ? 'Memperbarui...' : 'Menambahkan...'}
                                      </>
                                  ) : (
                                      isEditBeasiswaMode ? 'Perbarui Beasiswa' : 'Tambah Beasiswa'
                                  )}
                              </button>
                          </div>
                      </form>
                  </div>
              ) : (
                  <div className="overflow-x-auto">
                      {loading && beasiswas.length === 0 ? (
                          <div className="flex justify-center items-center h-48">
                              <Loader className="animate-spin text-blue-500" size={40} />
                              <span className="ml-3 text-lg text-gray-600">Memuat data beasiswa...</span>
                          </div>
                      ) : (
                          beasiswas.length === 0 ? (
                              <p className="text-center text-gray-500 text-lg py-10">Belum ada data beasiswa.</p>
                          ) : (
                              <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                      <tr className="bg-gray-50">
                                          <th className="border border-gray-300 p-2 text-left">No</th>
                                          <th className="border border-gray-300 p-2 text-left">Judul</th>
                                          <th className="border border-gray-300 p-2 text-left">Penyelenggara</th>
                                          <th className="border border-gray-300 p-2 text-left">Kategori</th>
                                          <th className="border border-gray-300 p-2 text-left">Jenjang</th>
                                          <th className="border border-gray-300 p-2 text-left">Deadline</th>
                                          <th className="border border-gray-300 p-2 text-left">Gambar</th>
                                          <th className="border border-gray-300 p-2 text-center">Aksi</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {beasiswas.map((beasiswa, index) => (
                                          <tr key={beasiswa.id} className="border-b border-gray-300">
                                              <td className="border border-gray-300 p-2">{index + 1}</td>
                                              <td className="border border-gray-300 p-2">{beasiswa.title}</td>
                                              <td className="border border-gray-300 p-2">{beasiswa.penyelenggara}</td>
                                              <td className="border border-gray-300 p-2">{beasiswa.kategori}</td>
                                              <td className="border border-gray-300 p-2">{beasiswa.jenjang}</td>
                                              <td className="border border-gray-300 p-2">{beasiswa.deadline}</td>
                                              <td className="border border-gray-300 p-2">
                                                  {beasiswa.imgUrl ? (
                                                      <img src={beasiswa.imgUrl} alt={beasiswa.title} className="w-16 h-16 object-cover rounded-md" />
                                                  ) : (
                                                      <span>Tidak Ada Gambar</span>
                                                  )}
                                              </td>
                                              <td className="border border-gray-300 p-2 text-center">
                                                  <button
                                                      onClick={() => handleEditBeasiswa(beasiswa)}
                                                      className="p-1 mr-1 bg-[#3375CC] text-white rounded hover:bg-[#295ea3]"
                                                  >
                                                      <Edit size={16} />
                                                  </button>
                                                  <button
                                                      onClick={() => handleDeleteBeasiswa(beasiswa)}
                                                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                  >
                                                      <Trash size={16} />
                                                  </button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          )
                      )}
                  </div>
              )}
            </div>
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white w-[510px] max-w-full rounded-xl shadow-2xl overflow-hidden z-[10000] animate-[modalFadeIn_0.3s_ease]">
              <div className="bg-gray-50 px-8 py-6 border-b flex justify-between items-center">
                <h5 className="flex items-center">
                  <AlertTriangle className="text-red-500 mr-2" size={28} />
                  <span className="text-lg">Konfirmasi Hapus Data</span>
                </h5>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={cancelDelete}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="p-10 text-center h-[320px] flex flex-col justify-center items-center">
                <Frown size={96} color="#dc3545" />
                <h4 className="mt-4 mb-3 text-xl font-medium">Apakah Anda yakin?</h4>
                <p className="text-lg mb-4">
                  Data {itemToDelete?.type === 'user' ? `user <strong>${itemToDelete?.name}</strong>` : `beasiswa <strong>${itemToDelete?.name}</strong>`} akan dihapus secara permanen.
                </p>
                <p className="text-red-500 text-sm">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="px-8 py-7 border-t flex justify-end gap-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 w-24"
                  onClick={cancelDelete}
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 w-24 flex items-center justify-center"
                  onClick={confirmDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin mr-2" size={16} />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash size={16} className="mr-1" /> Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminHome;