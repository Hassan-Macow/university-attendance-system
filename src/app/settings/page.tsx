'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  IconLock,
  IconEye,
  IconEyeOff,
  IconShield,
  IconRefresh,
  IconCheck,
  IconX
} from '@tabler/icons-react'
import { showToast } from '@/components/ui/toast'
import { getCurrentUser } from '@/lib/auth'

export default function SettingsPage() {
  // Password management state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast.error('Validation Error', 'New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      showToast.error('Validation Error', 'Password must be at least 8 characters long')
      return
    }

    if (!currentPassword) {
      showToast.error('Validation Error', 'Please enter your current password')
      return
    }

    setIsChangingPassword(true)
    try {
      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser || !currentUser.email || !currentUser.id) {
        showToast.error('Error', 'User not found. Please log in again.')
        return
      }

      // Import Supabase
      const { supabase } = await import('@/lib/supabase')
      
      // Check if user exists in Supabase Auth (for original admin users)
      try {
        // First, verify current password by trying to sign in
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: currentPassword
        })

        if (!signInError && authData.user) {
          // Current password is correct, now update it
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
          })

          if (!updateError) {
            // Successfully updated in Supabase Auth
            showToast.success('Success', 'Password changed successfully!')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            return
          } else {
            showToast.error('Error', 'Failed to update password in Supabase Auth')
            return
          }
        } else {
          // Current password is incorrect for Supabase Auth, try custom method
          console.log('Current password incorrect for Supabase Auth, trying custom method...')
        }
      } catch (authError) {
        console.log('Supabase Auth verification failed, trying custom method...')
      }

      // Fallback: Try custom user table method
      // Verify current password
      const { data: userData, error: verifyError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', currentUser.id)
        .single()

      if (verifyError || !userData) {
        showToast.error('Error', 'Failed to verify current password')
        return
      }

      // Check if current password matches
      if (userData.password_hash !== currentPassword) {
        showToast.error('Error', 'Current password is incorrect')
        return
      }

      // Update password in custom users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPassword })
        .eq('id', currentUser.id)

      if (updateError) {
        showToast.error('Error', 'Failed to update password')
        return
      }

      showToast.success('Success', 'Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      showToast.error('Error', 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
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

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Password Management */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-600 rounded-lg">
                  <IconShield className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Password Management</h3>
              </div>
              
              <div className="space-y-4 max-w-md mx-auto">
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
                    className="flex-1 bg-[#1B75BB] hover:bg-[#0d5a8a]"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>

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
        </div>
      </div>
    </MainLayout>
  )
}
