import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, LogIn, UserPlus, LayoutDashboard, LogOut, BookOpen, Edit3, PlusCircle, Link2, Sun, Moon, Image as ImageIcon, Award, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, InfoIcon, XCircle } from 'lucide-react';

// Configuration for API base URLs
// IMPORTANT: Replace these with your actual microservice URLs if they differ.
const API_BASE_URLS = {
  AUTH: 'http://localhost:5000', 
  CHILD_PROFILE: 'http://localhost:5002',
  ACTIVITY_LOG: 'http://localhost:5003',
};

// --- New Color Palette (Inspired by the Owl Image) ---
const brandColors = {
  primary: '#967259', // Muted, warm brown (Owl's body)
  primaryHover: '#7A5C47', // Darker shade for hover
  secondary: '#FBC4A6', // Peachy pink (Owl's cheeks / accent)
  secondaryHover: '#F8B08B', // Darker peach for hover
  background: '#FFF7ED', // Very light peach/beige (Image background)
  surface: '#FFFCF7', // Warmer off-white (Card backgrounds, Owl's belly)
  text: '#654321', // Dark, warm brown (Owl's outline / main text)
  textLight: '#8B6B5A', // Lighter warm brown (Secondary text)
  border: '#D1BFAE', // Light muted brown (Subtle borders)
  error: '#E57373', // Softer red for errors
  errorBg: '#FFEBEE',
  success: '#81C784', // Softer green for success
  successBg: '#E8F5E9',
  info: '#64B5F6', // Softer blue for info
  infoBg: '#E3F2FD',
  warning: '#FFB74D', // Softer orange for warning
  warningBg: '#FFF8E1',
};

// --- Context for Authentication ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isLoading, setIsLoading] = useState(true);

  // useCallback for apiRequest to memoize it
  const apiRequest = useCallback(async (service, endpoint, method = 'GET', body = null, requiresAuth = true, customHeaders = {}) => {
    const baseUrl = API_BASE_URLS[service];
    if (!baseUrl) {
      throw new Error(`Service URL for ${service} not configured.`);
    }
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      if (response.status === 401 && requiresAuth) {
        // Attempt to refresh token if a refresh token exists
        if (localStorage.getItem('refreshToken')) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URLS.AUTH}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('refreshToken')}`,
              },
            });
            if (refreshResponse.ok) {
              const { access_token } = await refreshResponse.json();
              setToken(access_token);
              localStorage.setItem('accessToken', access_token);
              // Retry original request with new token
              headers['Authorization'] = `Bearer ${access_token}`;
              const retryResponse = await fetch(url, { ...config, headers });
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({ message: retryResponse.statusText }));
                throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
              }
              return retryResponse.json().catch(() => ({})); // Handle cases where response might be empty JSON
            } else {
              // Refresh failed, logout user
              logout(); 
              throw new Error("Session expired. Please login again.");
            }
          } catch (refreshError) {
            logout(); // Logout on any error during refresh
            throw refreshError;
          }
        } else {
          // No refresh token, logout user
          logout();
          throw new Error("Session expired. Please login again.");
        }
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      // Handle 204 No Content or empty response body
      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {}; 
      }
      return response.json();
    } catch (error) {
      console.error(`API Request Error (${method} ${url}):`, error);
      throw error; // Re-throw to be caught by calling function
    }
  }, [token]); // Add logout to dependency array if it's used inside and defined outside


  const login = async (username, password) => {
    try {
      const data = await apiRequest('AUTH', '/auth/login', 'POST', { username, password }, false);
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      // Fetch user details after successful login
      await fetchUserDetails(data.access_token);
      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  // useCallback for fetchUserDetails
  const fetchUserDetails = useCallback(async (currentToken) => {
    if (!currentToken) return;
    try {
      const userData = await apiRequest('AUTH', '/auth/me', 'GET', null, true, { 'Authorization': `Bearer ${currentToken}`});
      setUser({
        id: userData.user_id,
        username: userData.username,
        role: userData.role,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
      });
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      // If fetching user details fails (e.g. token expired), log out
      logout();
    }
  }, [apiRequest]); // Add logout to dependency array


  const logout = useCallback(() => { // Wrapped logout in useCallback
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Potentially call backend logout endpoint if it exists
    // apiRequest('AUTH', '/auth/logout', 'POST', null, false).catch(e => console.warn("Logout API call failed or not implemented", e));
  }, []); // No dependencies for this version of logout

  // Effect to run on initial app load to check for existing token
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken); 
        await fetchUserDetails(storedToken);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchUserDetails]); // fetchUserDetails is now memoized


  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, apiRequest, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// --- Reusable Components ---
const MessageBox = ({ message, type, onDismiss }) => {
  if (!message) return null;

  const baseClasses = "p-4 mb-4 rounded-lg shadow-md flex items-center text-sm"; // Added text-sm
  const typeInfo = {
    success: { bg: brandColors.successBg, border: brandColors.success, text: brandColors.success, IconCmp: CheckCircle },
    error: { bg: brandColors.errorBg, border: brandColors.error, text: brandColors.error, IconCmp: XCircle },
    info: { bg: brandColors.infoBg, border: brandColors.info, text: brandColors.info, IconCmp: InfoIcon },
    warning: { bg: brandColors.warningBg, border: brandColors.warning, text: brandColors.warning, IconCmp: AlertTriangle },
  };
  
  const currentType = typeInfo[type] || typeInfo.info;

  return (
    <div 
      className={`${baseClasses} bg-[${currentType.bg}] border border-[${currentType.border}] text-[${currentType.text}]`}
    >
      <currentType.IconCmp className={`w-5 h-5 mr-3 flex-shrink-0 text-[${currentType.text}]`} />
      <span className="flex-grow">{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 focus:ring-[${brandColors.secondary}] focus:ring-opacity-50 inline-flex h-8 w-8 text-[${currentType.text}] hover:bg-[${currentType.border}] hover:bg-opacity-20`}
          aria-label="Dismiss"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

const InputField = ({ id, label, type = "text", value, onChange, placeholder, error, required = false, icon }) => (
  <div className="mb-4">
    <label htmlFor={id} className={`block text-sm font-medium text-[${brandColors.textLight}] mb-1`}>
      {label} {required && <span className={`text-[${brandColors.error}]`}>*</span>}
    </label>
    <div className="relative rounded-lg shadow-sm"> {/* Changed to rounded-lg */}
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{React.cloneElement(icon, { className: `h-5 w-5 text-[${brandColors.textLight}]` })}</div>}
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`block w-full px-3 py-2 border ${error ? `border-[${brandColors.error}]` : `border-[${brandColors.border}]`} bg-[${brandColors.surface}] text-[${brandColors.text}] rounded-lg focus:outline-none focus:ring-1 focus:ring-[${brandColors.secondary}] focus:border-[${brandColors.secondary}] sm:text-sm ${icon ? 'pl-10' : ''}`}
      />
    </div>
    {error && <p className={`mt-1 text-xs text-[${brandColors.error}]`}>{error}</p>}
  </div>
);

const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false, fullWidth = false, iconLeft, iconRight, className = "" }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FFFCF7]";
  
  const variantStyles = {
    primary: `text-white bg-[${brandColors.primary}] hover:bg-[${brandColors.primaryHover}] focus:ring-[${brandColors.primary}]`,
    secondary: `text-[${brandColors.primary}] bg-[${brandColors.secondary}] hover:bg-[${brandColors.secondaryHover}] focus:ring-[${brandColors.secondary}]`,
    danger: `text-white bg-[${brandColors.error}] hover:bg-opacity-80 focus:ring-[${brandColors.error}]`,
    ghost: `text-[${brandColors.text}] bg-transparent hover:bg-[${brandColors.secondary}] hover:bg-opacity-30 focus:ring-[${brandColors.secondary}]`,
  };
  const disabledStyle = "opacity-60 cursor-not-allowed";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyles[variant]} ${disabled ? disabledStyle : ''} ${fullWidth ? 'w-full' : ''} ${className} transition-colors duration-150 ease-in-out`}
    >
      {iconLeft && <span className="mr-2 -ml-1 h-5 w-5">{iconLeft}</span>}
      {children}
      {iconRight && <span className="ml-2 -mr-1 h-5 w-5">{iconRight}</span>}
    </button>
  );
};

const Card = ({ children, title, className = "" }) => (
  <div className={`bg-[${brandColors.surface}] shadow-xl rounded-xl overflow-hidden ${className}`}>
    {title && <div className={`px-4 py-5 sm:px-6 bg-[${brandColors.background}] border-b border-[${brandColors.border}]`}>
      <h3 className={`text-lg leading-6 font-medium text-[${brandColors.text}]`}>{title}</h3>
    </div>}
    <div className="px-4 py-5 sm:p-6">
      {children}
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div className={`bg-[${brandColors.surface}] rounded-xl shadow-xl p-6 m-4 ${sizeClasses[size]} w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold text-[${brandColors.text}]`}>{title}</h3>
          <button onClick={onClose} className={`text-[${brandColors.textLight}] hover:text-[${brandColors.text}]`}>
            <XCircle size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// --- Page Components ---
const LoginPage = ({ setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      setCurrentPage('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-[${brandColors.background}] py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* User's logo placeholder */}
          <img 
            src={`https://placehold.co/64x64/${brandColors.background.substring(1)}/${brandColors.text.substring(1)}?text=Logo`} 
            alt="Little Steps Logo" 
            className="mx-auto h-16 w-16 rounded-full" 
          />
          <h2 className={`mt-6 text-center text-3xl font-extrabold text-[${brandColors.text}]`}>
            Sign in to Little Steps
          </h2>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <MessageBox message={error} type="error" onDismiss={() => setError('')} />
            <InputField
              id="username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              icon={<User />}
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              icon={<LogIn className="transform rotate-90"/>}
            />
            <div>
              <Button type="submit" fullWidth disabled={isLoading} iconLeft={<LogIn size={18}/>}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
          <p className={`mt-6 text-center text-sm text-[${brandColors.textLight}]`}>
            Not a member?{' '}
            <button onClick={() => setCurrentPage('register')} className={`font-medium text-[${brandColors.primary}] hover:text-[${brandColors.primaryHover}]`}>
              Register here
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};

const RegisterPage = ({ setCurrentPage }) => {
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'parent', email: '', first_name: '', last_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiRequest } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }
    try {
      await apiRequest('AUTH', '/auth/register', 'POST', formData, false);
      setSuccess('Registration successful! Please login.');
      setFormData({ username: '', password: '', role: 'parent', email: '', first_name: '', last_name: '' });
      setTimeout(() => setCurrentPage('login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-[${brandColors.background}] py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* User's logo placeholder */}
          <img 
            src={`https://placehold.co/56x56/${brandColors.background.substring(1)}/${brandColors.text.substring(1)}?text=Logo`} 
            alt="Little Steps Logo" 
            className="mx-auto h-14 w-14 rounded-full" 
          />
          <h2 className={`mt-6 text-center text-3xl font-extrabold text-[${brandColors.text}]`}>
            Create your account
          </h2>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <MessageBox message={error} type="error" onDismiss={() => setError('')} />
            <MessageBox message={success} type="success" onDismiss={() => setSuccess('')} />
            <InputField id="username" label="Username" name="username" value={formData.username} onChange={handleChange} required />
            <InputField id="email" label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <InputField id="first_name" label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
            <InputField id="last_name" label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
            <InputField id="password" label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            <div>
              <label htmlFor="role" className={`block text-sm font-medium text-[${brandColors.textLight}] mb-1`}>Role <span className={`text-[${brandColors.error}]`}>*</span></label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className={`block w-full px-3 py-2 border border-[${brandColors.border}] bg-[${brandColors.surface}] text-[${brandColors.text}] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[${brandColors.secondary}] focus:border-[${brandColors.secondary}] sm:text-sm`}>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <Button type="submit" fullWidth disabled={isLoading} iconLeft={<UserPlus size={18}/>}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <p className={`mt-6 text-center text-sm text-[${brandColors.textLight}]`}>
            Already have an account?{' '}
            <button onClick={() => setCurrentPage('login')} className={`font-medium text-[${brandColors.primary}] hover:text-[${brandColors.primaryHover}]`}>
              Sign in
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};

const DashboardPage = ({ setCurrentPage, setSelectedChildId }) => {
  const { user, apiRequest } = useAuth();
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      setIsLoading(true);
      setError('');
      try {
        const data = await apiRequest('CHILD_PROFILE', '/profiles/children', 'GET');
        setChildren(Array.isArray(data) ? data : (data.children || [])); 
      } catch (err) {
        setError(err.message || 'Failed to load children data.');
        setChildren([]); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchChildren();
  }, [user, apiRequest]);

  if (isLoading && !children.length) return <div className="p-6 text-center text-[${brandColors.textLight}]">Loading dashboard...</div>;

  const handleViewChildProfile = (childId) => {
    setSelectedChildId(childId);
    setCurrentPage('childProfile');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className={`text-3xl font-bold text-[${brandColors.text}]`}>Welcome, {user?.firstName || user?.username}!</h1>
      <MessageBox message={error} type="error" onDismiss={() => setError('')} />
      
      <Card title={user?.role === 'parent' ? "Your Children" : "Linked Children"} className="mt-6">
        {user?.role === 'parent' && (
          <Button onClick={() => setCurrentPage('addChild')} iconLeft={<PlusCircle size={18}/>} className="mb-4">
            Add New Child
          </Button>
        )}
        {user?.role === 'teacher' && (
          <Button onClick={() => setCurrentPage('linkChild')} iconLeft={<Link2 size={18}/>} className="mb-4">
            Link to Child via Code
          </Button>
        )}

        {isLoading && <p className={`text-[${brandColors.textLight}]`}>Loading children...</p>}
        {!isLoading && children.length === 0 && (
          <p className={`text-[${brandColors.textLight}]`}>
            {user?.role === 'parent' ? "You haven't added any children yet." : "You are not linked to any children yet."}
          </p>
        )}
        {!isLoading && children.length > 0 && (
          <ul className={`divide-y divide-[${brandColors.border}]`}>
            {children.map(child => (
              <li key={child.child_id || child.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className={`text-lg font-medium text-[${brandColors.primary}]`}>{child.name}</p>
                  {child.group && <p className={`text-sm text-[${brandColors.textLight}]`}>Group: {child.group}</p>}
                </div>
                <Button onClick={() => handleViewChildProfile(child.child_id || child.id)} variant="secondary">
                  View Profile & Activities
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

const UserProfilePage = ({ setCurrentPage }) => {
  const { user, apiRequest, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);
    if (newPassword.length < 8) {
        setMessage({ text: "New password must be at least 8 characters long.", type: 'error'});
        setIsLoading(false);
        return;
    }
    try {
      await apiRequest('AUTH', '/auth/change-password', 'POST', { old_password: oldPassword, new_password: newPassword });
      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) return <div className={`p-6 text-[${brandColors.textLight}]`}>Loading profile...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className={`text-3xl font-bold text-[${brandColors.text}]`}>My Profile</h1>
      <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
      
      <Card title="User Information">
        <div className={`space-y-3 text-[${brandColors.text}]`}>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>First Name:</strong> {user.firstName}</p>
          <p><strong>Last Name:</strong> {user.lastName}</p>
          <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
        </div>
      </Card>

      <Card title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <InputField id="old_password" label="Old Password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          <InputField id="new_password" label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Change Password'}
          </Button>
        </form>
      </Card>
      <Button onClick={() => { logout(); setCurrentPage('login');}} variant="danger" iconLeft={<LogOut size={18}/>} className="mt-6">
        Logout
      </Button>
    </div>
  );
};

const AddChildPage = ({ setCurrentPage }) => {
  const { apiRequest } = useAuth();
  const [formData, setFormData] = useState({ name: '', birthday: '', group: '', allergies: '', notes: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [linkingCode, setLinkingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLinkingCode('');
    setIsLoading(true);
    try {
      const response = await apiRequest('CHILD_PROFILE', '/profiles/children', 'POST', formData);
      setMessage({ text: 'Child added successfully!', type: 'success' });
      setLinkingCode(response.linking_code);
      setFormData({ name: '', birthday: '', group: '', allergies: '', notes: '' }); 
    } catch (err) {
      setMessage({ text: err.message || 'Failed to add child.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className={`text-2xl font-semibold text-[${brandColors.text}] mb-6`}>Add New Child</h1>
      <Card>
        <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
        {linkingCode && (
          <div className={`my-4 p-3 bg-[${brandColors.infoBg}] border border-[${brandColors.info}] rounded-lg`}> {/* rounded-lg */}
            <p className={`font-semibold text-[${brandColors.info}]`}>Child Added! Share this Linking Code with Teachers:</p>
            <p className={`text-lg font-mono bg-[${brandColors.surface}] p-2 rounded mt-1 break-all text-[${brandColors.text}]`}>{linkingCode}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField id="name" name="name" label="Child's Name" value={formData.name} onChange={handleChange} required />
          <InputField id="birthday" name="birthday" label="Birthday" type="date" value={formData.birthday} onChange={handleChange} required />
          <InputField id="group" name="group" label="Group/Class" value={formData.group} onChange={handleChange} />
          <InputField id="allergies" name="allergies" label="Allergies (comma-separated)" value={formData.allergies} onChange={handleChange} />
          <div>
            <label htmlFor="notes" className={`block text-sm font-medium text-[${brandColors.textLight}] mb-1`}>Additional Notes</label>
            <textarea id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange} className={`block w-full px-3 py-2 border border-[${brandColors.border}] bg-[${brandColors.surface}] text-[${brandColors.text}] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[${brandColors.secondary}] focus:border-[${brandColors.secondary}] sm:text-sm`}></textarea>
          </div>
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={isLoading} iconLeft={<PlusCircle size={18}/>}>
              {isLoading ? 'Adding Child...' : 'Add Child'}
            </Button>
            <Button variant="ghost" onClick={() => setCurrentPage('dashboard')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const LinkChildPage = ({ setCurrentPage }) => {
  const { apiRequest } = useAuth();
  const [linkingCode, setLinkingCode] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);
    try {
      await apiRequest('CHILD_PROFILE', '/profiles/children/link-supervisor', 'POST', { linking_code: linkingCode });
      setMessage({ text: 'Successfully linked to child!', type: 'success' });
      setLinkingCode('');
      setTimeout(() => setCurrentPage('dashboard'), 2000);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to link to child. Invalid or expired code.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className={`text-2xl font-semibold text-[${brandColors.text}] mb-6`}>Link to a Child</h1>
      <Card>
        <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField id="linkingCode" label="Linking Code" value={linkingCode} onChange={e => setLinkingCode(e.target.value)} placeholder="Enter code from parent" required />
          <div className="flex space-x-3 pt-2">
            <Button type="submit" disabled={isLoading} iconLeft={<Link2 size={18}/>}>
              {isLoading ? 'Linking...' : 'Link to Child'}
            </Button>
            <Button variant="ghost" onClick={() => setCurrentPage('dashboard')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const ChildProfilePage = ({ setCurrentPage, childId }) => {
  const { apiRequest, user } = useAuth();
  const [childData, setChildData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({text: '', type: ''}); // For success/error messages on this page
  const [isEditing, setIsEditing] = useState(false);
  const [editableChildData, setEditableChildData] = useState(null);
  const [showLogActivityModal, setShowLogActivityModal] = useState(false);
  const [activityTypeToLog, setActivityTypeToLog] = useState('');

  useEffect(() => {
    if (!childId) {
      setError("No child selected.");
      setIsLoadingProfile(false);
      setIsLoadingActivities(false);
      return;
    }

    const fetchChildData = async () => {
      setIsLoadingProfile(true);
      setError('');
      setMessage({text: '', type: ''}); // Clear previous messages
      try {
        const data = await apiRequest('CHILD_PROFILE', `/profiles/children/${childId}`, 'GET');
        setChildData(data);
        setEditableChildData({...data}); 
      } catch (err) {
        setError(err.message || 'Failed to load child profile.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        const params = new URLSearchParams({ child_id: childId });
        const data = await apiRequest('ACTIVITY_LOG', `/activities?${params.toString()}`, 'GET');
        setActivities(Array.isArray(data) ? data : (data.activities || [])); 
      } catch (err) {
        setError(prev => `${prev} ${err.message || 'Failed to load activities.'}`.trim());
        setActivities([]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchChildData();
    fetchActivities();
  }, [childId, apiRequest]);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableChildData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    setError('');
    setMessage({text: '', type: ''});
    try {
      const dataToUpdate = { ...editableChildData };
      // Ensure birthday is in YYYY-MM-DD format if it exists
      if (dataToUpdate.birthday && dataToUpdate.birthday.includes('T')) {
          dataToUpdate.birthday = dataToUpdate.birthday.split('T')[0];
      }
      const updatedChild = await apiRequest('CHILD_PROFILE', `/profiles/children/${childId}`, 'PUT', dataToUpdate);
      setChildData(updatedChild); 
      setEditableChildData({...updatedChild});
      setIsEditing(false);
      setMessage({text: "Profile updated successfully!", type: "success"});
    } catch (err) {
      setError(err.message || "Failed to update child profile.");
      setMessage({text: err.message || "Failed to update child profile.", type: "error"});
    }
  };
  
  const openLogActivityModal = (type) => {
    setActivityTypeToLog(type);
    setShowLogActivityModal(true);
  };

  const onActivityLogged = () => {
    setShowLogActivityModal(false);
    setMessage({text: "Activity logged successfully!", type: "success"});
    // Refresh activities
    setIsLoadingActivities(true);
    const fetchActivitiesAgain = async () => {
      try {
        const params = new URLSearchParams({ child_id: childId });
        const data = await apiRequest('ACTIVITY_LOG', `/activities?${params.toString()}`, 'GET');
        setActivities(Array.isArray(data) ? data : (data.activities || []));
      } catch (err) {
        setError(prev => `${prev} ${err.message || 'Failed to reload activities.'}`.trim());
      } finally {
        setIsLoadingActivities(false);
      }
    };
    fetchActivitiesAgain();
     // Clear message after a few seconds
    setTimeout(() => setMessage({text: '', type: ''}), 3000);
  };

  if (isLoadingProfile && !childData) return <div className={`p-6 text-center text-[${brandColors.textLight}]`}>Loading child profile...</div>;
  // Show general page error if profile loading failed completely
  if (error && !childData && !isLoadingProfile) return <div className="p-6"><MessageBox message={error} type="error" /></div>;


  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className={`text-3xl font-bold text-[${brandColors.text}] mb-2 sm:mb-0`}>{childData?.name || "Child Profile"}</h1>
        <Button onClick={() => setCurrentPage('dashboard')} variant="secondary">Back to Dashboard</Button>
      </div>
      {/* Display general errors or success messages for the page */}
      <MessageBox message={error && !message.text ? error : message.text} type={message.text ? message.type : 'error'} onDismiss={() => { setError(''); setMessage({text:'', type:''})}} />


      <Card title="Child Details">
        {isLoadingProfile ? <p className={`text-[${brandColors.textLight}]`}>Loading details...</p> : childData ? (
          !isEditing ? (
            <div className={`space-y-2 text-[${brandColors.text}]`}>
              <p><strong>Name:</strong> {childData.name}</p>
              <p><strong>Birthday:</strong> {childData.birthday ? new Date(childData.birthday).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Group:</strong> {childData.group || 'N/A'}</p>
              <p><strong>Allergies:</strong> {childData.allergies || 'None'}</p>
              <p><strong>Notes:</strong> {childData.notes || 'None'}</p>
              {/* Basic auth check, real auth is backend-side */}
              {(user?.role === 'parent' || user?.id === childData.created_by_parent_id) && 
                <Button onClick={handleEditToggle} iconLeft={<Edit3 size={16}/>} variant="secondary" className="mt-2">Edit Profile</Button>
              }
            </div>
          ) : ( 
            <div className="space-y-4">
              <InputField id="name" name="name" label="Name" value={editableChildData.name || ''} onChange={handleInputChange} />
              <InputField id="birthday" name="birthday" label="Birthday" type="date" value={editableChildData.birthday?.split('T')[0] || ''} onChange={handleInputChange} />
              <InputField id="group" name="group" label="Group" value={editableChildData.group || ''} onChange={handleInputChange} />
              <InputField id="allergies" name="allergies" label="Allergies" value={editableChildData.allergies || ''} onChange={handleInputChange} />
              <div>
                <label htmlFor="notes" className={`block text-sm font-medium text-[${brandColors.textLight}] mb-1`}>Notes</label>
                <textarea id="notes" name="notes" rows="3" value={editableChildData.notes || ''} onChange={handleInputChange} className={`block w-full px-3 py-2 border border-[${brandColors.border}] bg-[${brandColors.surface}] text-[${brandColors.text}] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[${brandColors.secondary}] focus:border-[${brandColors.secondary}] sm:text-sm`}></textarea>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
                <Button onClick={handleEditToggle} variant="ghost">Cancel</Button>
              </div>
            </div>
          )
        ) : <p className={`text-[${brandColors.textLight}]`}>No child data available.</p>}
      </Card>

      <Card title="Log New Activity">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => openLogActivityModal('meal')} iconLeft={<Sun size={18} className={`text-[${brandColors.primary}]`}/>} fullWidth>Log Meal</Button>
          <Button onClick={() => openLogActivityModal('nap')} iconLeft={<Moon size={18} className={`text-[${brandColors.primary}]`}/>} fullWidth>Log Nap</Button>
          <Button onClick={() => openLogActivityModal('drawing')} iconLeft={<ImageIcon size={18} className={`text-[${brandColors.primary}]`}/>} fullWidth>Log Drawing</Button>
          <Button onClick={() => openLogActivityModal('behavior')} iconLeft={<Award size={18} className={`text-[${brandColors.primary}]`}/>} fullWidth>Log Behavior</Button>
        </div>
      </Card>
      
      <LogActivityModal 
        isOpen={showLogActivityModal} 
        onClose={() => setShowLogActivityModal(false)} 
        activityType={activityTypeToLog} 
        childId={childId}
        onActivityLogged={onActivityLogged}
      />

      <ActivityFeed activities={activities} isLoading={isLoadingActivities} />
    </div>
  );
};

const LogActivityModal = ({ isOpen, onClose, activityType, childId, onActivityLogged }) => {
  const { apiRequest } = useAuth();
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' }); // For modal-specific messages
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessage({ text: '', type: '' }); 
      // Default form data based on activity type
      switch (activityType) {
        case 'meal':
          setFormData({ timestamp: new Date().toISOString().slice(0,16), notes: '' });
          break;
        case 'nap':
          setFormData({ startTime: new Date().toISOString().slice(0,16), endTime: new Date().toISOString().slice(0,16), wokeUpDuring: false, notes: '' });
          break;
        case 'drawing':
          setFormData({ timestamp: new Date().toISOString().slice(0,16), photoUrl: '', title: '', description: '' });
          break;
        case 'behavior':
          setFormData({ date: new Date().toISOString().split('T')[0], activities: '', grade: 'Good', notes: '' });
          break;
        default:
          setFormData({});
      }
    }
  }, [isOpen, activityType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);
    
    let endpoint = '';
    let payload = { ...formData, childId }; 

    try {
      switch (activityType) {
        case 'meal':
          endpoint = '/log/meal';
          payload = { childId, timestamp: new Date(formData.timestamp).toISOString(), notes: formData.notes };
          break;
        case 'nap':
          endpoint = '/log/nap';
          payload = { childId, startTime: new Date(formData.startTime).toISOString(), endTime: new Date(formData.endTime).toISOString(), wokeUpDuring: !!formData.wokeUpDuring, notes: formData.notes };
          break;
        case 'drawing':
          endpoint = '/log/drawing';
          payload = { childId, timestamp: new Date(formData.timestamp).toISOString(), photoUrl: formData.photoUrl, title: formData.title, description: formData.description };
          break;
        case 'behavior':
          endpoint = '/log/behavior';
          payload = { childId, date: formData.date, activities: formData.activities.split(',').map(s => s.trim()).filter(s => s), grade: formData.grade, notes: formData.notes };
          break;
        default:
          throw new Error("Invalid activity type");
      }

      await apiRequest('ACTIVITY_LOG', endpoint, 'POST', payload);
      // No setMessage here, parent (ChildProfilePage) will show it via onActivityLogged
      setIsLoading(false);
      onActivityLogged(); // This will close modal and refresh data in parent
    } catch (err) {
      setMessage({ text: err.message || `Failed to log ${activityType}.`, type: 'error' });
      setIsLoading(false);
    }
  };
  
  const renderFormFields = () => {
    switch (activityType) {
      case 'meal':
        return (
          <>
            <InputField id="timestamp" name="timestamp" label="Timestamp" type="datetime-local" value={formData.timestamp || ''} onChange={handleChange} required />
            <InputField id="notes" name="notes" label="Notes" value={formData.notes || ''} onChange={handleChange} required />
          </>
        );
      case 'nap':
        return (
          <>
            <InputField id="startTime" name="startTime" label="Start Time" type="datetime-local" value={formData.startTime || ''} onChange={handleChange} required />
            <InputField id="endTime" name="endTime" label="End Time" type="datetime-local" value={formData.endTime || ''} onChange={handleChange} required />
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" name="wokeUpDuring" checked={!!formData.wokeUpDuring} onChange={handleChange} className={`form-checkbox h-5 w-5 text-[${brandColors.primary}] rounded focus:ring-[${brandColors.secondary}] border-[${brandColors.border}] bg-[${brandColors.surface}]`} />
                <span className={`ml-2 text-sm text-[${brandColors.textLight}]`}>Woke up during nap?</span>
              </label>
            </div>
            <InputField id="notes" name="notes" label="Notes (optional)" value={formData.notes || ''} onChange={handleChange} />
          </>
        );
      case 'drawing':
        return (
          <>
            <InputField id="timestamp" name="timestamp" label="Timestamp" type="datetime-local" value={formData.timestamp || ''} onChange={handleChange} required />
            <InputField id="photoUrl" name="photoUrl" label="Photo URL" type="url" value={formData.photoUrl || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" required />
            <InputField id="title" name="title" label="Title (optional)" value={formData.title || ''} onChange={handleChange} />
            <InputField id="description" name="description" label="Description (optional)" value={formData.description || ''} onChange={handleChange} />
          </>
        );
      case 'behavior':
        return (
          <>
            <InputField id="date" name="date" label="Date" type="date" value={formData.date || ''} onChange={handleChange} required />
            <InputField id="activities" name="activities" label="Activities (comma-separated)" value={formData.activities || ''} onChange={handleChange} placeholder="e.g., Circle time, Outdoor play" required />
            <div className="mb-4">
                <label htmlFor="grade" className={`block text-sm font-medium text-[${brandColors.textLight}] mb-1`}>Grade <span className={`text-[${brandColors.error}]`}>*</span></label>
                <select id="grade" name="grade" value={formData.grade || 'Good'} onChange={handleChange} className={`block w-full px-3 py-2 border border-[${brandColors.border}] bg-[${brandColors.surface}] text-[${brandColors.text}] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[${brandColors.secondary}] focus:border-[${brandColors.secondary}] sm:text-sm`}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                </select>
            </div>
            <InputField id="notes" name="notes" label="Notes (optional)" value={formData.notes || ''} onChange={handleChange} />
          </>
        );
      default:
        return <p className={`text-[${brandColors.textLight}]`}>Unknown activity type.</p>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log ${activityType ? activityType.charAt(0).toUpperCase() + activityType.slice(1) : ''}`}>
      <MessageBox message={message.text} type={message.type} onDismiss={() => setMessage({text:'', type:''})} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderFormFields()}
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging...' : `Log ${activityType}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


const ActivityFeed = ({ activities, isLoading }) => {
  const [openActivityId, setOpenActivityId] = useState(null);

  if (isLoading) return <div className={`p-4 text-center text-[${brandColors.textLight}]`}>Loading activities...</div>;
  if (!activities || activities.length === 0) return <Card title="Activity Feed"><p className={`text-[${brandColors.textLight}]`}>No activities logged yet for this child.</p></Card>;

  const toggleActivityDetails = (activityId) => {
    setOpenActivityId(openActivityId === activityId ? null : activityId);
  };
  
  const getIconForActivity = (type) => {
    switch(type) {
      case 'meal': return <Sun className={`text-[${brandColors.secondary}]`} />;
      case 'nap': return <Moon className={`text-[${brandColors.info}]`} />; 
      case 'drawing': return <ImageIcon className={`text-[${brandColors.primary}]`} />;
      case 'behavior': return <Award className={`text-[${brandColors.success}]`} />;
      default: return <BookOpen className={`text-[${brandColors.textLight}]`} />;
    }
  };

  return (
    <Card title="Activity Feed">
      <ul className="space-y-4">
        {activities.map(activity => (
          <li key={activity.activity_id || activity.id} className={`bg-[${brandColors.background}] p-4 rounded-lg shadow-sm border border-[${brandColors.border}]`}>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleActivityDetails(activity.activity_id || activity.id)}>
              <div className="flex items-center">
                <span className="mr-3">{getIconForActivity(activity.type)}</span>
                <h3 className={`text-md font-semibold text-[${brandColors.primary}] capitalize`}>{activity.type}</h3>
                <span className={`ml-3 text-sm text-[${brandColors.textLight}]`}>
                  {new Date(activity.timestamp || activity.start_time || activity.date).toLocaleString()}
                </span>
              </div>
              {openActivityId === (activity.activity_id || activity.id) ? 
                <ChevronUp size={20} className={`text-[${brandColors.textLight}]`} /> : 
                <ChevronDown size={20} className={`text-[${brandColors.textLight}]`} />}
            </div>
            {openActivityId === (activity.activity_id || activity.id) && (
              <div className={`mt-3 pl-8 text-sm text-[${brandColors.text}] space-y-1`}>
                {activity.notes && <p><strong>Notes:</strong> {activity.notes}</p>}
                {activity.type === 'meal' && (<></>)} {/* Meal notes already covered */}
                {activity.type === 'nap' && (
                  <>
                    <p><strong>Start:</strong> {new Date(activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>End:</strong> {new Date(activity.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Woke up during:</strong> {activity.woke_up_during ? 'Yes' : 'No'}</p>
                  </>
                )}
                {activity.type === 'drawing' && (
                  <>
                    {activity.title && <p><strong>Title:</strong> {activity.title}</p>}
                    {activity.description && <p><strong>Description:</strong> {activity.description}</p>}
                    {activity.image_url && <p><strong>Image:</strong> <a href={activity.image_url} target="_blank" rel="noopener noreferrer" className={`text-[${brandColors.secondaryHover}] hover:underline`}>View Image</a></p>}
                  </>
                )}
                {activity.type === 'behavior' && (
                  <>
                    <p><strong>Date:</strong> {new Date(activity.date).toLocaleDateString()}</p>
                    {activity.activities && Array.isArray(activity.activities) && <p><strong>Activities:</strong> {activity.activities.join(', ')}</p>}
                    {activity.grade && <p><strong>Grade:</strong> {activity.grade}</p>}
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

// --- Navigation Bar Component ---
const Navbar = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
  };

  return (
    <nav className={`bg-[${brandColors.primary}] text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => setCurrentPage(user ? 'dashboard' : 'login')} className="flex-shrink-0 flex items-center">
              {/* User's logo placeholder - Remember to replace src with your actual logo path or URL */}
              <img 
                src={`https://placehold.co/40x40/${brandColors.primary.substring(1)}/FFFFFF?text=LS`} // Placeholder: LS for Little Steps
                alt="Little Steps Logo" 
                className="h-10 w-10 mr-2 rounded-full" // Added rounded-full for circular logos
              />
              <span className="font-semibold text-xl tracking-tight">Little Steps</span>
            </button>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2"> {/* Reduced space for smaller screens */}
            {!user ? (
              <>
                <Button onClick={() => setCurrentPage('login')} variant="ghost" className={`text-white hover:bg-[${brandColors.primaryHover}] px-2 sm:px-3`} iconLeft={<LogIn size={18}/>}>Login</Button>
                <Button onClick={() => setCurrentPage('register')} variant="ghost" className={`text-white hover:bg-[${brandColors.primaryHover}] px-2 sm:px-3`} iconLeft={<UserPlus size={18}/>}>Register</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setCurrentPage('dashboard')} variant="ghost" className={`text-white hover:bg-[${brandColors.primaryHover}] px-2 sm:px-3`} iconLeft={<LayoutDashboard size={18}/>}>Dashboard</Button>
                <Button onClick={() => setCurrentPage('userProfile')} variant="ghost" className={`text-white hover:bg-[${brandColors.primaryHover}] px-2 sm:px-3`} iconLeft={<User size={18}/>}>Profile</Button>
                <Button onClick={handleLogout} variant="ghost" className={`text-white hover:bg-[${brandColors.primaryHover}] px-2 sm:px-3`} iconLeft={<LogOut size={18}/>}>Logout</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


// --- Main App Component ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [selectedChildId, setSelectedChildId] = useState(null); 
  const { user, isLoading: authIsLoading } = useAuth();

  // Effect to handle page redirection based on auth state
  useEffect(() => {
    if (!authIsLoading) { // Only run when auth loading is complete
        if (user) {
            // If user is logged in and on login/register page, redirect to dashboard
            if (currentPage === 'login' || currentPage === 'register') {
                setCurrentPage('dashboard');
            }
        } else {
            // If user is not logged in and not on login/register, redirect to login
            if (currentPage !== 'register' && currentPage !== 'login') {
                setCurrentPage('login');
            }
        }
    }
  }, [user, authIsLoading, currentPage]);


  const renderPage = () => {
    if (authIsLoading) {
      return <div className="flex justify-center items-center h-screen"><p className={`text-xl text-[${brandColors.primary}]`}>Loading application...</p></div>;
    }

    // Public pages accessible without login
    if (currentPage === 'login') return <LoginPage setCurrentPage={setCurrentPage} />;
    if (currentPage === 'register') return <RegisterPage setCurrentPage={setCurrentPage} />;

    // Protected pages - user must be logged in
    if (!user) {
        // This should ideally be caught by the useEffect above, but as a fallback:
        return <LoginPage setCurrentPage={setCurrentPage} />;
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage setCurrentPage={setCurrentPage} setSelectedChildId={setSelectedChildId} />;
      case 'userProfile':
        return <UserProfilePage setCurrentPage={setCurrentPage} />;
      case 'addChild':
        return <AddChildPage setCurrentPage={setCurrentPage} />;
      case 'linkChild':
        return <LinkChildPage setCurrentPage={setCurrentPage} />;
      case 'childProfile':
        return <ChildProfilePage setCurrentPage={setCurrentPage} childId={selectedChildId} />;
      default:
        // Fallback for unknown pages when logged in: redirect to dashboard
        setCurrentPage('dashboard'); 
        return <DashboardPage setCurrentPage={setCurrentPage} setSelectedChildId={setSelectedChildId} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[${brandColors.background}] font-sans`}>
      <Navbar setCurrentPage={setCurrentPage} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderPage()}
      </main>
      <style jsx global>{`
        body {
          background-color: ${brandColors.background}; 
        }
        @keyframes modalShow {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modalShow {
          animation: modalShow 0.3s forwards;
        }
        /* More rounded corners for inputs globally */
        input[type="text"], input[type="password"], input[type="email"], input[type="url"], input[type="date"], input[type="datetime-local"], select, textarea {
          border-radius: 0.5rem; /* Corresponds to rounded-lg */
        }
        /* Style scrollbars for a softer look - WebKit browsers */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${brandColors.background};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${brandColors.border};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${brandColors.textLight}; 
        }
      `}</style>
    </div>
  );
};

// Entry point for the React application
export default function Main() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

