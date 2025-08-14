import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";

import LogoEscolinha from "../assets/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faMoneyBillWave,
  faUser,
  faUserCircle,
  faRightFromBracket,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import FeedbackModal from "../components/FeedbackModal";

export default function ParentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [confirmarLogout, setConfirmarLogout] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState("Carregando...");
  const [feedbackModal, setFeedbackModal] = useState({ // CORRIGIDO: Adicionado o estado 'feedbackModal' que estava faltando
    show: false,
    message: "",
    type: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUserEmail(user.email || "Usuário sem e-mail");
      } else {
        setLoggedInUserEmail("Não logado");
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    setConfirmarLogout(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setFeedbackModal({ // CORRIGIDO: Usando FeedbackModal em vez de alert
        show: true,
        message: "Erro ao fazer logout. Tente novamente.",
        type: "error",
      });
    }
  };

  return (
    <>
      {/* Cabeçalho */}
      <nav className="fixed z-40 w-full bg-white border-b border-gray-200">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button
                id="toggleSidebarMobile"
                type="button"
                className="p-2 text-gray-600 rounded-lg cursor-pointer lg:hidden hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-gray-100"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <span className="sr-only">Abrir/fechar barra lateral</span>
                <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} className="w-6 h-6" />
              </button>
              <Link
                to="/responsavel/dashboard"
                className="flex ml-2 md:mr-24 items-center"
              >
                <img
                  src={LogoEscolinha}
                  className="h-9 mr-3"
                  alt="Logo Escolinha"
                />
                <span className="self-center text-2xl font-bold sm:text-3xl whitespace-nowrap text-gray-900">
                  Chute Inicial
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Abrir menu do usuário</span>
                    <FontAwesomeIcon icon={faUserCircle} className="w-7 h-7 text-gray-500" />
                  </button>
                </div>
                <div
                  className={`absolute right-0 top-full mt-2 z-50 w-48 text-base list-none bg-white divide-y divide-gray-100 rounded shadow ${
                    isUserMenuOpen ? "block" : "hidden"
                  }`}
                >
                  <div className="px-4 py-3" role="none">
                    <p className="text-sm text-gray-900" role="none">
                      Responsável
                    </p>
                    <p
                      className="text-sm font-medium text-gray-900 truncate"
                      role="none"
                    >
                      {loggedInUserEmail}
                    </p>
                  </div>
                  <ul className="py-1" role="none">
                    <li>
                      <button
                        onClick={() => {
                          closeUserMenu();
                          setConfirmarLogout(true);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        role="menuitem"
                      >
                        Sair
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-45 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-50 w-64 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 pt-16`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50">
          <ul className="space-y-2 font-medium">
            <li>
              <Link
                to="/responsavel/dashboard"
                className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faHome} className="w-5 h-5 text-gray-500 transition-all group-hover:text-gray-900" />
                <span className="ms-3">Início</span>
              </Link>
            </li>
            <li>
              <Link
                to="/responsavel/pagamentos"
                className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5 text-gray-500 transition-all group-hover:text-gray-900" />
                <span className="ms-3">Pagamentos</span>
              </Link>
            </li>
            <li>
              <Link
                to="/responsavel/perfil"
                className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
                onClick={closeSidebar}
              >
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gray-500 transition-all group-hover:text-gray-900" />
                <span className="ms-3">Perfil</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  closeSidebar();
                  setConfirmarLogout(true);
                }}
                className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group w-full text-left"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="shrink-0 w-5 h-5 text-gray-500 transition-all group-hover:text-gray-900" />
                <span className="flex-1 ms-3 whitespace-nowrap">Sair</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div className="p-4 sm:ml-64 sm:pt-20 lg:pt-24">
        <Outlet />
      </div>

      {confirmarLogout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-55">
          <div className="relative w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <button
                type="button"
                className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={() => setConfirmarLogout(false)}
              >
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Fechar modal</span>
              </button>
              <div className="p-6 text-center">
                <svg
                  className="mx-auto mb-4 text-gray-400 w-12 h-12"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <h3 className="mb-5 text-lg font-normal text-gray-500">
                  Tem certeza que deseja sair?
                </h3>
                <button
                  onClick={handleLogout}
                  type="button"
                  className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2"
                >
                  Sim, sair
                </button>
                <button
                  onClick={() => setConfirmarLogout(false)}
                  type="button"
                  className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                >
                  Não, cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {feedbackModal.show && (
        <FeedbackModal
          message={feedbackModal.message}
          type={feedbackModal.type}
          onClose={() => setFeedbackModal({ show: false, message: "", type: "" })}
        />
      )}
    </>
  );
}
