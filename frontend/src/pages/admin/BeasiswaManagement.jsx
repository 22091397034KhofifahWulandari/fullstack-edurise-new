import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash, ArrowLeft, Loader } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// URL dasar API Anda
const API_BASE_URL = "http://localhost:5000"; // Pastikan ini sesuai dengan URL backend Anda

const BeasiswaManagement = () => {
    const [beasiswas, setBeasiswas] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedBeasiswa, setSelectedBeasiswa] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [imageFile, setImageFile] = useState(null); // State untuk file gambar yang dipilih (objek File)
    const [previewImg, setPreviewImg] = useState(null); // State untuk pratinjau gambar (URL Blob atau URL dari backend)
    const formRef = useRef(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        penyelenggara: '',
        description: '',
        detail: '',
        kategori: '',
        jenjang: '',
        lokasi: '',
        link: '',
        deadline: '',
        // imgUrl (formerly 'img'): This will hold the URL from the backend for display purposes
        imgUrl: '',
        // currentImgName: This will hold the original filename from the backend, important for knowing if an old image exists
        currentImgName: ''
    });

    useEffect(() => {
        getBeasiswas();
    }, []);

    const getBeasiswas = async () => {
        setLoading(true);
        setMsg(""); // Bersihkan pesan sebelumnya
        try {
            const response = await axios.get(`${API_BASE_URL}/beasiswa`);
            const formattedData = response.data.map(b => ({
                id: b.uuid, // Pastikan ini adalah UUID yang unik untuk identifikasi
                title: b.title,
                penyelenggara: b.penyelenggara,
                description: b.description,
                detail: b.detail,
                kategori: b.kategori,
                jenjang: b.jenjang,
                lokasi: b.lokasi,
                link: b.link,
                // Pastikan deadline valid sebelum memformat
                deadline: b.deadline && !isNaN(new Date(b.deadline))
                    ? new Date(b.deadline).toISOString().split('T')[0]
                    : '', // Mengembalikan string kosong jika tidak valid
                imgUrl: b.img ? `${API_BASE_URL}${b.img}` : null, // Full URL for display
                currentImgName: b.img, // Store the relative path from DB for backend logic
            }));
            setBeasiswas(formattedData);
        } catch (error) {
            console.error("Error fetching beasiswas:", error);
            setMsg(`Error fetching data: ${error.response?.data?.msg || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setImageFile(file);
        if (file) {
            setPreviewImg(URL.createObjectURL(file)); // Membuat URL pratinjau
        } else {
            setPreviewImg(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");

        const data = new FormData();
        // Append all text fields
        for (const key in formData) {
            if (key !== 'imgUrl' && key !== 'currentImgName') { // Exclude display-only fields
                data.append(key, formData[key]);
            }
        }

        // --- IMAGE HANDLING LOGIC ---
        if (imageFile) {
            // New file selected, append it with the field name 'img' (matching Multer config)
            data.append('img', imageFile);
        } else if (isEditMode && formData.currentImgName) {
            // No new file, but in edit mode and there was an existing image.
            // Tell backend to keep the existing image by sending its original path/name.
            // The backend update logic will look for this.
            data.append('existingImg', formData.currentImgName);
        } else if (isEditMode && !imageFile && !formData.currentImgName && previewImg) {
            // This scenario implies user had an old image, but then cleared the file input
            // without providing a new one. This means they want to remove the image.
            data.append('removeImg', 'true');
        }

        try {
            if (isEditMode) {
                // Untuk UPDATE (PATCH request)
                await axios.patch(`${API_BASE_URL}/beasiswa/${selectedBeasiswa.id}`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data' // Penting untuk Multer
                    }
                });
                setMsg("Beasiswa berhasil diperbarui!");
            } else {
                // Untuk CREATE (POST request)
                // Ensure a file is present for creation if it's required (your backend validation handles this).
                // If you want to enforce image upload on create at the frontend, add a check here.
                if (!imageFile) {
                    setMsg("Gambar beasiswa wajib diisi untuk penambahan baru.");
                    setLoading(false);
                    return;
                }
                await axios.post(`${API_BASE_URL}/beasiswa`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data' // Penting untuk Multer
                    }
                });
                setMsg("Beasiswa berhasil ditambahkan!");
            }
            setShowForm(false);
            resetForm();
            getBeasiswas(); // Muat ulang data setelah submit
        } catch (error) {
            console.error("Error submitting form:", error);
            if (error.response) {
                setMsg(error.response.data.msg || "Terjadi kesalahan saat menyimpan beasiswa.");
            } else {
                setMsg("Terjadi kesalahan jaringan atau server tidak merespon.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (beasiswa) => {
        setIsEditMode(true);
        setSelectedBeasiswa(beasiswa);
        setFormData({
            title: beasiswa.title,
            penyelenggara: beasiswa.penyelenggara,
            description: beasiswa.description,
            detail: beasiswa.detail,
            kategori: beasiswa.kategori,
            jenjang: beasiswa.jenjang,
            lokasi: beasiswa.lokasi,
            link: beasiswa.link,
            deadline: beasiswa.deadline, // Format YYYY-MM-DD sudah pas untuk input type="date"
            imgUrl: beasiswa.imgUrl, // Full URL for preview
            currentImgName: beasiswa.currentImgName, // Original relative path for backend
        });
        setPreviewImg(beasiswa.imgUrl); // Tampilkan pratinjau gambar lama
        setImageFile(null); // Reset file baru
        setMsg(""); // Bersihkan pesan sebelumnya
        setShowForm(true);
    };

    const handleDelete = (beasiswa) => {
        setSelectedBeasiswa(beasiswa);
        setShowDeleteModal(true);
        setMsg(""); // Bersihkan pesan sebelumnya
    };

    const confirmDelete = async () => {
        setLoading(true);
        setMsg("");
        try {
            await axios.delete(`${API_BASE_URL}/beasiswa/${selectedBeasiswa.id}`);
            setMsg("Beasiswa berhasil dihapus!");
            setShowDeleteModal(false);
            getBeasiswas(); // Muat ulang data setelah delete
        } catch (error) {
            console.error("Error deleting beasiswa:", error);
            setMsg(`Error deleting data: ${error.response?.data?.msg || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            penyelenggara: '',
            description: '',
            detail: '',
            kategori: '',
            jenjang: '',
            lokasi: '',
            link: '',
            deadline: '',
            imgUrl: '', // Reset imgUrl
            currentImgName: '', // Reset currentImgName
        });
        setImageFile(null);
        setPreviewImg(null);
        setIsEditMode(false);
        setSelectedBeasiswa(null);
        setMsg(""); // Bersihkan pesan
    };

    const handleAddClick = () => {
        resetForm();
        setShowForm(true);
    };

    return (
        // Menggunakan padding-top untuk memberikan ruang di bawah header fixed
        <div className="min-h-screen bg-gray-100 pb-4" style={{ paddingTop: '80px' }}> {/* Sesuaikan dengan tinggi header */}
            {/* Header */}
            <header className="bg-white h-[60px] px-5 shadow-md fixed top-0 left-0 right-0 z-50 flex items-center">
                <div className="w-full flex justify-between items-center">
                    <div className="flex items-center">
                            <Link
                                to="/adminhome"
                                className="mr-3 text-gray-600 hover:text-gray-900"
                            >
                            <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="rounded-full overflow-hidden flex items-center justify-center mr-3">
                                <img src="/img/eduriselanding/Ellipse 1.png" alt="EduRise Logo" className="w-[40px] h-[40px] object-contain" />
                            </div>
                        <h4 className="m-0 italic font-bold ml-2"> <span className="text-[#3375cc]">EDU<span className="text-[#dda853]">RISE</span></span> ADMIN</h4>
                    </div>
                </div>
            </header>

            <main className="bg-white p-6 rounded-lg shadow-md mx-5"> {/* Menambahkan margin horizontal */}
                {msg && (
                    <div className={`p-3 mb-4 rounded ${msg.includes("Error") ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {msg}
                    </div>
                )}

                {showForm ? (
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold mb-4">{isEditMode ? 'Edit Beasiswa' : 'Tambah Beasiswa Baru'}</h2>
                        <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-gray-700 font-medium mb-1">Judul Beasiswa</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
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
                                    value={formData.penyelenggara}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-gray-700 font-medium mb-1">Deskripsi Singkat</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
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
                                    value={formData.detail}
                                    onChange={handleInputChange}
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
                                    value={formData.kategori}
                                    onChange={handleInputChange}
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
                                    value={formData.jenjang}
                                    onChange={handleInputChange}
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
                                    value={formData.lokasi}
                                    onChange={handleInputChange}
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
                                    value={formData.link}
                                    onChange={handleInputChange}
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
                                    value={formData.deadline}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="image" className="block text-gray-700 font-medium mb-1">Gambar Beasiswa</label>
                                <input
                                    type="file"
                                    id="image"
                                    name="image" // Keep this as 'image' for simplicity, but Multer expects 'img'
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    // Required only if adding and no current image, or editing and no new file selected AND no old image exists
                                    required={!isEditMode && !formData.currentImgName && !imageFile}
                                />
                                {previewImg && (
                                    <div className="mt-2">
                                        <img src={previewImg} alt="Preview" className="max-w-xs h-auto rounded-md shadow" />
                                    </div>
                                )}
                                {isEditMode && !previewImg && formData.imgUrl && (
                                    <div className="mt-2 text-gray-600 text-sm">
                                        Gambar saat ini: <a href={formData.imgUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{formData.currentImgName || "gambar lama"}</a>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); resetForm(); }}
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
                                            {isEditMode ? 'Memperbarui...' : 'Menambahkan...'}
                                        </>
                                    ) : (
                                        isEditMode ? 'Perbarui Beasiswa' : 'Tambah Beasiswa'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={handleAddClick}
                            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Tambah Beasiswa Baru
                        </button>

                        {loading && beasiswas.length === 0 ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader className="animate-spin text-blue-500" size={40} />
                                <span className="ml-3 text-lg text-gray-600">Memuat data beasiswa...</span>
                            </div>
                        ) : (
                            beasiswas.length === 0 ? (
                                <p className="text-center text-gray-500 text-lg py-10">Belum ada data beasiswa.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penyelenggara</th>
                                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenjang</th>
                                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
                                                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {beasiswas.map((beasiswa, index) => (
                                                <tr key={beasiswa.id}>
                                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{beasiswa.title}</td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{beasiswa.penyelenggara}</td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{beasiswa.kategori}</td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{beasiswa.jenjang}</td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">{beasiswa.deadline}</td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-900">
                                                        {beasiswa.imgUrl ? (
                                                            <img src={beasiswa.imgUrl} alt={beasiswa.title} className="w-16 h-16 object-cover rounded-md" />
                                                        ) : (
                                                            <span>Tidak Ada Gambar</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEdit(beasiswa)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(beasiswa)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Hapus"
                                                        >
                                                            <Trash className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                            <h3 className="text-lg font-medium mb-4">Konfirmasi Hapus</h3>
                            <p className="text-gray-500 mb-4">
                                Apakah Anda yakin ingin menghapus beasiswa "{selectedBeasiswa?.title}"?
                            </p>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="animate-spin mr-2" size={20} />
                                            Menghapus...
                                        </>
                                    ) : (
                                        'Hapus'
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

export default BeasiswaManagement;