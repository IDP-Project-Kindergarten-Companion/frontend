// src/components/layout/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import Button from '../ui/Button'; // Adjusted path
import { User, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Placeholder image URL generation
  const primaryColorHex = "967259"; // From brand.primary
  const textColorHex = "FFFFFF"; // For text on primary background

  return (
    <nav className="bg-brand-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/login"} className="flex-shrink-0 flex items-center">
              <img 
                src={`../../../public/logo.png`}
                alt="Little Steps Logo" 
                className="h-10 w-10 mr-2 rounded-full"
              />
              <span className="font-semibold text-xl tracking-tight">Little Steps</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {!user ? (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" className="text-white hover:bg-brand-primaryHover px-2 sm:px-3" iconLeft={<LogIn size={18}/>}>Login</Button>
                <Button onClick={() => navigate('/register')} variant="ghost" className="text-white hover:bg-brand-primaryHover px-2 sm:px-3" iconLeft={<UserPlus size={18}/>}>Register</Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-white hover:bg-brand-primaryHover px-2 sm:px-3" iconLeft={<LayoutDashboard size={18}/>}>Dashboard</Button>
                <Button onClick={() => navigate('/profile')} variant="ghost" className="text-white hover:bg-brand-primaryHover px-2 sm:px-3" iconLeft={<User size={18}/>}>Profile</Button>
                <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-brand-primaryHover px-2 sm:px-3" iconLeft={<LogOut size={18}/>}>Logout</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
