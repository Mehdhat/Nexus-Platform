import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Bell, MessageCircle, User, LogOut, Building2, CircleDollarSign, Calendar, FileText, Wallet, Video, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useTour } from '../../context/TourContext';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { startTour } = useTour();
  const navigate = useNavigate();

  const handleStartTour = () => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      setIsMenuOpen(true);
      window.setTimeout(() => startTour(), 350);
      return;
    }
    startTour();
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // User dashboard route based on role
  const dashboardRoute = user?.role === 'entrepreneur' 
    ? '/dashboard/entrepreneur' 
    : '/dashboard/investor';
  
  // User profile route based on role and ID
  const profileRoute = user 
    ? `/profile/${user.role}/${user.id}` 
    : '/login';
  
  const navLinks = [
    {
      icon: user?.role === 'entrepreneur' ? <Building2 size={18} /> : <CircleDollarSign size={18} />,
      text: 'Dashboard',
      path: dashboardRoute,
      dataTour: 'nav-dashboard',
    },
    {
      icon: user ? <Calendar size={18} /> : <Calendar size={18} />,
      text: 'Calendar',
      path: user ? '/calendar' : '/login',
      dataTour: 'nav-calendar',
    },
    {
      icon: user ? <Wallet size={18} /> : <Wallet size={18} />,
      text: 'Payments',
      path: user ? '/payments' : '/login',
      dataTour: 'nav-payments',
    },
    {
      icon: user ? <FileText size={18} /> : <FileText size={18} />,
      text: 'Documents',
      path: user ? '/documents' : '/login',
      dataTour: 'nav-documents',
    },
    {
      icon: user ? <Video size={18} /> : <Video size={18} />,
      text: 'Video Call',
      path: user ? '/video-call' : '/login',
      dataTour: 'nav-video-call',
    },
    {
      icon: user?.role === 'entrepreneur' ? <CircleDollarSign size={18} /> : <Building2 size={18} />,
      text: user?.role === 'entrepreneur' ? 'Find Investors' : 'Find Startups',
      path: user ? (user.role === 'entrepreneur' ? '/investors' : '/entrepreneurs') : '/login',
      dataTour: 'nav-find',
    },
    {
      icon: <MessageCircle size={18} />,
      text: 'Messages',
      path: user ? '/messages' : '/login',
      dataTour: 'nav-messages',
    },
    {
      icon: <Bell size={18} />,
      text: 'Notifications',
      path: user ? '/notifications' : '/login',
      dataTour: 'nav-notifications',
    },
    {
      icon: <User size={18} />,
      text: 'Profile',
      path: profileRoute,
      dataTour: 'nav-profile',
    }
  ];
  
  return (
    <nav className="bg-white shadow-md overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-nowrap">
          {/* Logo and brand */}
          <div className="flex-shrink-0 flex items-center min-w-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="hidden xl:inline text-lg font-bold text-gray-900 truncate">Business Nexus</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:ml-6">
            {user ? (
              <div className="flex items-center flex-nowrap">
                <div className="flex items-center flex-nowrap gap-1">
                  {navLinks.map((link, index) => (
                    <Link
                      key={index}
                      to={link.path}
                      data-tour={(link as any).dataTour}
                      className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                      title={link.text}
                      aria-label={link.text}
                    >
                      {link.icon}
                    </Link>
                  ))}
                </div>

                <div className="flex items-center flex-nowrap gap-1 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartTour}
                    leftIcon={<Sparkles size={18} />}
                    className="whitespace-nowrap"
                  >
                    Take Tour
                  </Button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                    title="Logout"
                    aria-label="Logout"
                  >
                    <LogOut size={18} />
                  </button>

                  <Link
                    to={profileRoute}
                    className="flex items-center ml-1"
                    title={user.name}
                    aria-label="Profile"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.name}
                      size="sm"
                      status={user.isOnline ? 'online' : 'offline'}
                    />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="flex items-center space-x-3 px-3 py-2">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="sm"
                    status={user.isOnline ? 'online' : 'offline'}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-2">
                  {navLinks.map((link, index) => (
                    <Link
                      key={index}
                      to={link.path}
                      data-tour={(link as any).dataTour}
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="mr-3">{link.icon}</span>
                      {link.text}
                    </Link>
                  ))}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut size={18} className="mr-3" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3 py-2">
                <Link 
                  to="/login" 
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" fullWidth>Log in</Button>
                </Link>
                <Link 
                  to="/register" 
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button fullWidth>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};