'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
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

export default function PasswordManagementPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    setIsChanging(true)
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
      setIsChanging(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      alert('Please enter an email address')
      return
    }

    setIsResetting(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Password reset email sent!')
      setResetEmail('')
    } catch (error) {
      alert('Error sending reset email')
    } finally {
      setIsResetting(false)
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
              Password Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Change your password and manage security settings
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconKey className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your current password to a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    disabled={isChanging || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="flex-1"
                  >
                    {isChanging ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Reset */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShield className="h-5 w-5" />
                  Password Reset
                </CardTitle>
                <CardDescription>
                  Send password reset email to users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  disabled={isResetting || !resetEmail}
                  className="w-full"
                >
                  {isResetting ? 'Sending...' : 'Send Reset Email'}
                </Button>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains numbers</li>
                    <li>• Contains special characters (!@#$%^&*)</li>
                    <li>• Not easily guessable</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Features */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5" />
                Security Features
              </CardTitle>
              <CardDescription>
                Additional security measures for the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">GPS Location Verification</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Attendance can only be marked within campus boundaries
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Session Management</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatic logout after inactivity for security
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Role-Based Access</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Different access levels for different user types
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Password Encryption</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All passwords are encrypted and securely stored
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Audit Logging</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All user actions are logged for security monitoring
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Optional 2FA for enhanced security (coming soon)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
