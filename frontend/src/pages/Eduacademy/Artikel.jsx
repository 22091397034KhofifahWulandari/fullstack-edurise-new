// Artikel.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Pastikan Anda sudah setup react-router-dom
import { Loader2 } from 'lucide-react'; // Import ikon loading

import HeroArtikel from "/img/eduacademy/img.png";
import Header from "../../components/Navbar";
import Footer from "../../components/Footer";

// --- Konfigurasi URL API dari .env ---
// GANTI BARIS INI
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

// Komponen Card Artikel Reusable (Tidak ada perubahan)
const ArticleCard = ({ uuid, judul, deskripsi, gambar, link, kategori, penulis, tanggal }) => {
  const displayedLink = link || `/artikel/${uuid}`; // Prioritaskan link eksternal, jika tidak ada gunakan link internal

  return (
    <a href={displayedLink} target={link ? "_blank" : "_self"} rel={link ? "noopener noreferrer" : ""} className="block h-full">
      <div className="border p-4 rounded-xl shadow-sm hover:shadow-md transition h-full flex flex-col">
        {gambar && (
          <img
            src={gambar}
            alt={judul}
            className="w-full h-40 object-cover rounded-lg mb-3"
            onError={(e) => { e.target.onerror = null; e.target.src = "/path/to/fallback-image.png" }} // Ganti dengan path gambar fallback yang sesuai
          />
        )}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
            {kategori}
          </span>
          <span className="flex items-center text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <h4 className="font-semibold text-lg mb-2 text-[#1F467A] line-clamp-2">
          {judul}
        </h4>
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
          {deskripsi}
        </p>
        <div className="mt-auto flex items-center text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Oleh {penulis}
        </div>
      </div>
    </a>
  );
};


function Artikel() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GANTI BAGIAN INI
      const response = await axios.get(`${API_BASE_URL}/artikel`); // Gunakan API_BASE_URL

      // Modifikasi data untuk URL gambar penuh
      const fetchedArticles = response.data.map(article => ({
        ...article,
        gambar: article.img ? `${API_BASE_URL}${article.img}` : null // Pastikan path gambar benar
      }));
      setArticles(fetchedArticles);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Gagal memuat artikel. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const allCategories = [...new Set(articles.map(article => article.kategori))];

  const getArticlesByCategory = (category) => {
    return articles.filter(article => article.kategori === category);
  };

  // Tentukan kategori yang ingin ditampilkan secara spesifik di halaman utama
  // Atau bisa juga semua kategori jika tidak ada filter khusus
  const categoriesToDisplay = ['Pendidikan', 'Karir', 'Tips & Trik', 'Inspirasi']; // Contoh kategori yang ingin ditampilkan

  return (
    <>
      <Header />
      <main className="pt-[100px] bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-[#1F467A] to-[#3375CC] text-white py-20 px-4 md:px-8">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Jelajahi Dunia Pengetahuan
              </h1>
              <p className="text-lg md:text-xl mb-6">
                Temukan artikel inspiratif dan informatif untuk mendukung perjalanan edukasi dan karir Anda.
              </p>
              <Link
                to="/artikel/all"
                className="bg-white text-[#3375CC] font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300"
              >
                Lihat Semua Artikel
              </Link>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <img
                src={HeroArtikel}
                alt="Artikel Hero"
                className="max-w-full h-auto rounded-lg shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Article Categories Section */}
        <section className="container mx-auto px-4 md:px-8 py-12">
          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="animate-spin text-[#3375CC]" size={48} />
              <p className="mt-4 text-lg text-gray-600">Memuat artikel...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {!loading && !error && articles.length === 0 && (
            <p className="text-center text-gray-600 text-lg py-10">Belum ada artikel yang tersedia saat ini.</p>
          )}

          {!loading && !error && articles.length > 0 && (
            <>
              {categoriesToDisplay.map((categoryDisplayName) => {
                const categoryArticles = getArticlesByCategory(categoryDisplayName);

                if (categoryArticles.length === 0) {
                  return null;
                }

                return (
                  <div key={categoryDisplayName} className="mb-12">
                    <h3 className="text-3xl font-bold mb-6 text-[#1F467A]">
                      {categoryDisplayName}
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {categoryArticles.slice(0, 3).map((article) => ( // Tampilkan hanya 3 artikel per kategori
                        <ArticleCard key={article.uuid} {...article} />
                      ))}
                    </div>
                    {/* Link ke halaman detail kategori baru yang generik */}
                    <div className="text-center mt-8">
                      <Link
                        to={`/artikel/kategori/${encodeURIComponent(categoryDisplayName.toLowerCase().replace(/\s/g, '-'))}`} // Gunakan slug untuk URL kategori
                        className="mt-4 bg-[#3375CC] hover:bg-blue-600 text-white px-8 py-3 rounded-full text-md inline-block shadow-lg transition duration-300"
                      >
                        Lihat Lebih Banyak di {categoryDisplayName}
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Jika ada kategori lain yang tidak termasuk di categoriesToDisplay, bisa ditampilkan di sini atau di halaman "Lihat Semua Artikel" */}
              {/* Contoh: tampilkan kategori yang tersisa di bagian bawah */}
              {allCategories.filter(cat => !categoriesToDisplay.includes(cat)).length > 0 && (
                <div className="mb-12 mt-16">
                  <h3 className="text-3xl font-bold mb-6 text-[#1F467A]">
                    Kategori Lainnya
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allCategories.filter(cat => !categoriesToDisplay.includes(cat)).map(otherCategory => {
                      const articlesFromOtherCategory = getArticlesByCategory(otherCategory);
                      return articlesFromOtherCategory.length > 0 && (
                        <div key={otherCategory} className="border p-4 rounded-xl shadow-sm bg-white hover:shadow-md transition flex flex-col justify-between items-center text-center">
                          <h4 className="font-semibold text-xl text-[#1F467A] mb-4">{otherCategory}</h4>
                          <p className="text-gray-600 mb-6">Temukan artikel menarik seputar {otherCategory}.</p>
                          <Link
                            to={`/artikel/kategori/${encodeURIComponent(otherCategory.toLowerCase().replace(/\s/g, '-'))}`}
                            className="bg-[#3375CC] hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm inline-block"
                          >
                            Lihat Artikel
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Artikel;