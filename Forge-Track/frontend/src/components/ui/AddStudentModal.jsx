import { useState, useEffect } from 'react';
import { X, AlertCircle, User, GraduationCap, ShieldCheck, Phone, Mail, Hash, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import { addStudent, updateStudent } from '../../lib/api';
import toast from 'react-hot-toast';

export function AddStudentModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    usn: '',
    email: '',
    department: 'CS',
    phone: '',
    batchYear: new Date().getFullYear(),
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData((prev) => ({
        ...prev,
        fullName: initialData.fullName || prev.fullName,
        usn: initialData.usn || prev.usn,
        email: initialData.email || prev.email,
        department: initialData.department || prev.department,
        phone: initialData.phone || prev.phone,
        batchYear: initialData.batchYear || prev.batchYear,
      }));
    }
  }, [initialData, isOpen]);

  const departments = ['CS', 'AI', 'IS', 'ECE', 'ME', 'CE'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.usn.trim()) errors.usn = 'USN is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.batchYear) errors.batchYear = 'Batch year is required';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      // Ensure batchYear is a valid number before sending
      const parsedBatchYear = parseInt(formData.batchYear);
      if (isNaN(parsedBatchYear)) {
        throw new Error('Invalid batch year format');
      }

      if (initialData && initialData._id) {
        // Update existing student
        await updateStudent(initialData._id, { ...formData, batchYear: parsedBatchYear });
        toast.success('Student updated successfully!');
      } else {
        await addStudent({ ...formData, batchYear: parsedBatchYear });
        toast.success('Student enrolled successfully!');
      }

      toast.success('Student enrolled successfully!');
      
      setFormData({
        fullName: '',
        usn: '',
        email: '',
        department: 'CS',
        phone: '',
        batchYear: new Date().getFullYear(),
        password: '',
        confirmPassword: '',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Enroll New Student"
      className="max-w-2xl"
      footer={
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 sm:flex-none px-6"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="enroll-student-form"
            variant="primary"
            className="flex-1 sm:flex-none min-w-[160px] shadow-lg shadow-accent/20"
            loading={loading}
          >
            Confirm Enrollment
          </Button>
        </div>
      }
    >
      <div className="max-h-[65vh] overflow-y-auto pr-4 -mr-2 custom-scrollbar">
        {error && (
          <div className="mb-6 p-4 rounded-xl flex gap-3 items-start bg-danger/10 border border-danger/20 animate-shake">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger leading-relaxed">{error}</p>
          </div>
        )}

        <form id="enroll-student-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
          {/* Section: Personal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <User size={16} />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Personal Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={fieldErrors.fullName}
                placeholder="e.g., John Doe"
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={fieldErrors.email}
                placeholder="student@forge.local"
              />
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Section: Academic */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <GraduationCap size={16} />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Academic Credentials</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Input
                  label="USN / ID"
                  name="usn"
                  value={formData.usn}
                  onChange={handleChange}
                  error={fieldErrors.usn}
                  placeholder="4SH24CS001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-fg-secondary uppercase tracking-wider ml-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-surface-inset border border-border-default rounded-xl px-4 py-3 text-sm text-fg-primary outline-none focus:border-accent transition-all appearance-none cursor-pointer hover:border-border-strong"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Batch Year"
                name="batchYear"
                type="number"
                value={formData.batchYear}
                onChange={handleChange}
                error={fieldErrors.batchYear}
              />
            </div>
          </div>

          {/* Section: Security */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <ShieldCheck size={16} />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Account Security</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Temporary Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={fieldErrors.password}
                placeholder="••••••••"
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={fieldErrors.confirmPassword}
                placeholder="••••••••"
              />
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
