'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  IconSettings,
  IconDeviceFloppy,
  IconBuilding,
  IconMapPin,
  IconClock,
  IconLock,
  IconEye,
  IconEyeOff,
  IconShield,
  IconKey,
  IconRefresh,
  IconMail,
  IconCheck,
  IconX
} from '@tabler/icons-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    universityName: 'University',
    defaultAttendanceRadius: '100',
    autoMarkAbsent: true,
    autoMarkAbsentMinutes: '15'
  })

  const [isSaving, setIsSaving] = useState(false)
  
  // Password management state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Mock save functionality
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert('Settings saved successfully!')
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    setIsChangingPassword(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      alert('Error changing password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      alert('Please enter an email address')
      return
    }

    setIsResettingPassword(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Password reset email sent!')
      setResetEmail('')
    } catch (error) {
      alert('Error sending reset email')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
    setConfirmPassword(password)
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(newPassword)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure system settings and preferences
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* General Settings */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#1B75BB] rounded-lg">
                  <IconSettings className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="universityName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    University Name
                  </Label>
                  <div className="relative">
                    <IconBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="universityName"
                      value={settings.universityName}
                      onChange={(e) => setSettings({ ...settings, universityName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultAttendanceRadius" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attendance Radius (meters)
                  </Label>
                  <div className="relative">
                    <IconMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="defaultAttendanceRadius"
                      type="number"
                      value={settings.defaultAttendanceRadius}
                      onChange={(e) => setSettings({ ...settings, defaultAttendanceRadius: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Settings */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-600 rounded-lg">
                  <IconSettings className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Settings</h3>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="autoMarkAbsentMinutes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-mark absent after (minutes)
                    </Label>
                    <div className="relative">
                      <IconClock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="autoMarkAbsentMinutes"
                        type="number"
                        value={settings.autoMarkAbsentMinutes}
                        onChange={(e) => setSettings({ ...settings, autoMarkAbsentMinutes: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-mark absent enabled
                    </Label>
                    <div className="flex items-center space-x-3 pt-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="autoMarkAbsent"
                          checked={settings.autoMarkAbsent}
                          onChange={(e) => setSettings({ ...settings, autoMarkAbsent: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically mark students as absent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Management */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-600 rounded-lg">
                  <IconShield className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Password Management</h3>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Change Password */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Change Your Password</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <IconLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showCurrentPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <IconLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showNewPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-2 flex-1 rounded ${
                                level <= passwordStrength
                                  ? strengthColors[Math.min(passwordStrength - 1, 4)]
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Password strength: {strengthLabels[Math.min(passwordStrength - 1, 4)] || 'Very Weak'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <IconLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <IconX className="h-4 w-4" />
                        Passwords do not match
                      </p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <IconCheck className="h-4 w-4" />
                        Passwords match
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={generateSecurePassword} variant="outline" className="flex-1">
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Generate Secure Password
                    </Button>
                    <Button 
                      onClick={handleChangePassword} 
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="flex-1"
                    >
                      {isChangingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </div>

                {/* Password Reset */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Reset User Password</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">User Email</Label>
                    <div className="relative">
                      <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10"
                        placeholder="Enter user email address"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleResetPassword} 
                    disabled={isResettingPassword || !resetEmail}
                    className="w-full"
                  >
                    {isResettingPassword ? 'Sending...' : 'Send Reset Email'}
                  </Button>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Password Requirements:</h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains numbers and special characters</li>
                      <li>• Not easily guessable</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-[#1B75BB] hover:bg-[#0d5a8a] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
