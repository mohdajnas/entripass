"use client";

import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Smile, 
  ArrowLeft,
  Edit2,
  Save,
  X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { updateProfile } from "./actions";

interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  phone_number: string | null;
  email: string | null;
  gender: string | null;
  dob: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export function ProfileClient({ profile: initialProfile }: { profile: Profile }) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Edit form state
  const [editFullName, setEditFullName] = useState(profile.full_name);
  const [editUsername, setEditUsername] = useState(profile.username || "");
  const [editPhoneNumber, setEditPhoneNumber] = useState(profile.phone_number || "");
  const [editEmail, setEditEmail] = useState(profile.email || "");
  const [editGender, setEditGender] = useState(profile.gender || "");
  const [editDob, setEditDob] = useState(profile.dob || "");
  const [editCity, setEditCity] = useState(profile.city || "");
  const [editState, setEditState] = useState(profile.state || "");
  const [editBio, setEditBio] = useState(profile.bio || "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatar_url || "");

  const handleCancel = () => {
    // Reset form states to current profile values
    setEditFullName(profile.full_name);
    setEditUsername(profile.username || "");
    setEditPhoneNumber(profile.phone_number || "");
    setEditEmail(profile.email || "");
    setEditGender(profile.gender || "");
    setEditDob(profile.dob || "");
    setEditCity(profile.city || "");
    setEditState(profile.state || "");
    setEditBio(profile.bio || "");
    setEditAvatarUrl(profile.avatar_url || "");
    setErrorMessage("");
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("fullName", editFullName);
    formData.append("username", editUsername);
    formData.append("phoneNumber", editPhoneNumber);
    formData.append("email", editEmail);
    formData.append("gender", editGender);
    formData.append("dob", editDob);
    formData.append("city", editCity);
    formData.append("state", editState);
    formData.append("bio", editBio);
    formData.append("avatarUrl", editAvatarUrl);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setProfile({
          ...profile,
          full_name: editFullName,
          username: editUsername || null,
          phone_number: editPhoneNumber || null,
          email: editEmail || null,
          gender: editGender || null,
          dob: editDob || null,
          city: editCity || null,
          state: editState || null,
          bio: editBio || null,
          avatar_url: editAvatarUrl || null,
        });
        setIsEditing(false);
      } else {
        setErrorMessage(result.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format DOB if it exists
  const formattedDob = profile.dob 
    ? new Date(profile.dob).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "Not provided";

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage your personal information and preferences</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg shadow-emerald-500/10"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Card Profile Overview */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            {/* Profile Avatar */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-600 text-3xl font-bold border-2 border-emerald-500/20 shadow-inner overflow-hidden mb-4">
              {editAvatarUrl ? (
                <img 
                  src={editAvatarUrl} 
                  alt={profile.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.full_name.charAt(0).toUpperCase()
              )}
            </div>

            {isEditing ? (
              <div className="w-full space-y-3 mb-2">
                <div className="text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Profile Photo URL</label>
                  <Input 
                    type="url" 
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
                <p className="text-sm text-emerald-600 font-semibold mb-1">@{profile.username || "no_username"}</p>
                <p className="text-xs text-slate-400">Member since {joinDate}</p>
              </>
            )}

            <div className="w-full border-t border-slate-100 my-4 pt-4 text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Bio</span>
              {isEditing ? (
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-950 placeholder:text-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none focus:bg-white"
                />
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {profile.bio || "No bio added yet. Tell us about yourself!"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Info Fields */}
        <div className="md:col-span-2">
          <div className="glass-card bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-955 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Smile className="w-5 h-5 text-emerald-600" /> Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Username */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Username
                </span>
                {isEditing ? (
                  <Input 
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.username || "Not set"}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                </span>
                {isEditing ? (
                  <Input 
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.full_name}
                  </p>
                )}
              </div>

              {/* Email ID */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email ID
                </span>
                {isEditing ? (
                  <Input 
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100 truncate">
                    {profile.email || "Not set"}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                </span>
                {isEditing ? (
                  <Input 
                    type="tel"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.phone_number || "Not set"}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Gender
                </span>
                {isEditing ? (
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-10 focus:bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100 capitalize">
                    {profile.gender ? profile.gender.replace(/_/g, " ") : "Not set"}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
                </span>
                {isEditing ? (
                  <Input 
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                    {formattedDob}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> City
                </span>
                {isEditing ? (
                  <Input 
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.city || "Not set"}
                  </p>
                )}
              </div>

              {/* State */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> State
                </span>
                {isEditing ? (
                  <Input 
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                  />
                ) : (
                  <p className="text-base font-medium text-slate-900 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                    {profile.state || "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
