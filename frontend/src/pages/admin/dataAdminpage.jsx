import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const DataAdmin = () => {
    const navigate = useNavigate();

    return (
        <>
            <header className="bg-white shadow-md h-[80px] fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                
                {/* Kiri: Logo + Tulisan */}
                <div className="flex items-center space-x-3">
                <Link to="/adminhome" className="flex items-center">
                    <div className="rounded-full overflow-hidden flex items-center justify-center">
                    <img
                        src="/img/eduriselanding/Ellipse 1.png"
                        alt="EduRise Logo"
                        className="w-[50px] h-[50px] object-contain"
                    />
                    </div>
                </Link>
                <h1 className="text-xl font-bold text-[#3375cc] italic">
                    Profile <span className="text-[#dda853]">Admin</span>
                </h1>
                </div>

                {/* Kanan: Tombol Logout */}
                <Link to="/loginadmin">
                <button className="w-[80px] h-[36px] flex items-center justify-center rounded-lg bg-[#3375CC] text-white font-semibold text-sm shadow-md hover:bg-[#295ea3] hover:-translate-y-0.5 transition duration-200">
                    Logout
                </button>
                </Link>

            </div>
            </header>

            <main className="flex justify-center items-center min-h-screen pt-[120px] px-4 pb-10">
                <div
                    className="flex flex-col items-center w-[1181px] h-[797px] p-[30px] gap-6 flex-shrink-0 rounded-lg border border-[#3375CC] bg-[#F9FAFB] overflow-y-auto"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Edit Data Admin</h2>

                    <form className="w-full max-w-[800px] px-8 py-6 space-y-6">
                        <div className="mb-4">
                            <label htmlFor="nama" className="block font-bold mb-2 text-gray-700">Nama</label>
                            <input
                                type="text"
                                id="nama"
                                name="nama"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                                placeholder="Masukkan nama lengkap"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="username" className="block font-bold mb-2 text-gray-700">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                                placeholder="Masukkan username"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="email" className="block font-bold mb-2 text-gray-700">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                                placeholder="Masukkan email"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="phone" className="block font-bold mb-2 text-gray-700">Nomor HP</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                                placeholder="Masukkan nomor HP"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block font-bold mb-2 text-gray-700">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3375CC]/25 focus:border-[#3375CC]"
                                placeholder="Masukkan password baru"
                            />
                        </div>

                        <div className="flex justify-center mt-10 mb-6">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-[#3375CC] text-white font-semibold rounded-lg hover:bg-[#295ea3] transition-colors"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default DataAdmin;
