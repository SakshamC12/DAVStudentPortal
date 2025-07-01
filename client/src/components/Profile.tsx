import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, Phone, MapPin, Calendar, BookOpen } from 'lucide-react';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: number;
  semester: number;
  dateOfBirth: string;
  pfp_url?: string;
}

interface ProfileData {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  semester: number;
  date_of_birth: string;
  phone: string;
  address: string;
  gender?: string;
  blood_group?: string;
  secondary_email?: string;
  pfp_url?: string;
}

interface Guardian {
  id: number;
  student_id: number;
  guardian_name: string;
  guardian_contact: string;
  relation: string;
}

interface ProfileProps {
  student: Student;
  onProfileUpdate: (updatedStudent: Student) => void;
  adminView?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ student, onProfileUpdate, adminView }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  // Editable fields state
  const [editProfile, setEditProfile] = useState<Partial<ProfileData>>({});
  const [editGuardians, setEditGuardians] = useState<Guardian[]>([]);
  const [newGuardian, setNewGuardian] = useState<Partial<Guardian>>({ guardian_name: '', guardian_contact: '', relation: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', student.studentId)
        .eq('date_of_birth', student.dateOfBirth)
        .single();
      if (profileError || !profile) {
        setError('Invalid Student ID or Date of Birth');
        setLoading(false);
        return;
      }
      setProfile(profile);
      setEditProfile({
        secondary_email: profile.secondary_email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
      // Fetch guardians
      const { data: guardians, error: guardiansError } = await supabase
        .from('guardians')
        .select('*')
        .eq('student_id', profile.id);
      if (!guardiansError && guardians) {
        setGuardians(guardians);
        setEditGuardians(guardians);
      }
    } catch (err: any) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = (e.target as any).name;
    const value = (e.target as any).value;
    setEditProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardianChange = (idx: number, field: keyof Guardian, value: string) => {
    setEditGuardians((prev) => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
  };

  const handleNewGuardianChange = (field: keyof Guardian, value: string) => {
    setNewGuardian((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGuardian = () => {
    if (!newGuardian.guardian_name || !newGuardian.guardian_contact || !newGuardian.relation) return;
    setEditGuardians((prev) => [...prev, { ...newGuardian, id: 0, student_id: profile!.id } as Guardian]);
    setNewGuardian({ guardian_name: '', guardian_contact: '', relation: '' });
  };

  const handleDeleteGuardian = (idx: number) => {
    setEditGuardians((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEdit = () => {
    setEditMode(true);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditProfile({
      secondary_email: profile?.secondary_email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setEditGuardians(guardians);
    setNewGuardian({ guardian_name: '', guardian_contact: '', relation: '' });
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Update students table
      const { error: updateError } = await supabase
        .from('students')
        .update({
          secondary_email: editProfile.secondary_email,
          phone: editProfile.phone,
          address: editProfile.address,
        })
        .eq('id', profile!.id);
      if (updateError) throw updateError;
      // Update guardians
      // 1. Update or insert
      for (const g of editGuardians) {
        if (g.id === 0) {
          // New guardian
          if (g.guardian_name && g.guardian_contact && g.relation) {
            await supabase.from('guardians').insert({
              student_id: profile!.id,
              guardian_name: g.guardian_name,
              guardian_contact: g.guardian_contact,
              relation: g.relation,
            });
          }
        } else {
          // Existing guardian
          await supabase.from('guardians').update({
            guardian_name: g.guardian_name,
            guardian_contact: g.guardian_contact,
            relation: g.relation,
          }).eq('id', g.id);
        }
      }
      // 2. Delete guardians removed in edit
      const originalIds = guardians.map((g) => g.id);
      const editedIds = editGuardians.filter((g) => g.id !== 0).map((g) => g.id);
      const toDelete = originalIds.filter((id) => !editedIds.includes(id));
      for (const id of toDelete) {
        await supabase.from('guardians').delete().eq('id', id);
      }
      // Fetch updated student and call onProfileUpdate
      const { data: updatedStudent } = await supabase
        .from('students')
        .select('*')
        .eq('id', profile!.id)
        .single();
      if (updatedStudent) {
        onProfileUpdate({
          id: updatedStudent.id,
          studentId: updatedStudent.student_id,
          name: updatedStudent.name,
          email: updatedStudent.email,
          department: updatedStudent.department,
          year: updatedStudent.year,
          dateOfBirth: updatedStudent.date_of_birth,
          semester: updatedStudent.semester,
          pfp_url: updatedStudent.pfp_url,
        });
      }
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      fetchProfile();
    } catch (err: any) {
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as any).files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      // Delete old profile picture if it exists and is not the default
      if (profile.pfp_url && !profile.pfp_url.includes('/default_pfp.png')) {
        // Extract the file name from the public URL
        const match = profile.pfp_url.match(/profile-pictures\/(.+)$/);
        if (match && match[1]) {
          await supabase.storage.from('profile-pictures').remove([match[1]]);
        }
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.student_id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      // Get public URL
      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      // Update student pfp_url
      const { error: updateError } = await supabase
        .from('students')
        .update({ pfp_url: publicUrl })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      // Fetch updated student and call onProfileUpdate
      const { data: updatedStudent } = await supabase
        .from('students')
        .select('*')
        .eq('id', profile.id)
        .single();
      if (updatedStudent) {
        onProfileUpdate({
          id: updatedStudent.id,
          studentId: updatedStudent.student_id,
          name: updatedStudent.name,
          email: updatedStudent.email,
          department: updatedStudent.department,
          year: updatedStudent.year,
          dateOfBirth: updatedStudent.date_of_birth,
          semester: updatedStudent.semester,
          pfp_url: updatedStudent.pfp_url,
        });
      }
      setSuccess('Profile picture updated!');
      fetchProfile();
    } catch (err: any) {
      setError('Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', padding: 0 }}>
        <div style={{ background: '#a6192e', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.5rem 2rem 1rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Profile Picture */}
          <div style={{ marginBottom: 16 }}>
            <img
              src={profile?.pfp_url || '/default_pfp.png'}
              alt="Profile"
              style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', background: '#eee' }}
            />
            {editMode && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  disabled={uploading}
                  style={{ marginTop: 4 }}
                />
                {uploading && <span style={{ marginLeft: 8, color: '#a6192e' }}>Uploading...</span>}
              </div>
            )}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 0 }}>Student Profile</h1>
          <p style={{ fontSize: '1.1rem', marginTop: 4, opacity: 0.95 }}>View and manage your personal information</p>
        </div>
        <div style={{ padding: '2rem' }}>
          {success && <div className="alert alert-success mb-4">{success}</div>}
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <table style={{ width: '100%', fontSize: '1.1rem' }}>
            <tbody>
              <tr>
                <td className="font-semibold" style={{ width: '220px', padding: '12px 8px' }}>Full Name</td>
                <td>
                  {editMode && adminView ? (
                    <input type="text" name="name" className="form-input" value={editProfile.name || ''} onChange={handleProfileChange} style={{ width: '100%' }} />
                  ) : (
                    profile?.name
                  )}
                </td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Student ID</td>
                <td>{profile?.student_id}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Email Address</td>
                <td>
                  {editMode && adminView ? (
                    <input type="email" name="email" className="form-input" value={editProfile.email || ''} onChange={handleProfileChange} style={{ width: '100%' }} />
                  ) : (
                    profile?.email
                  )}
                </td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Secondary Email</td>
                <td>
                  {editMode ? (
                    <input
                      type="email"
                      name="secondary_email"
                      className="form-input"
                      value={editProfile.secondary_email || ''}
                      onChange={handleProfileChange}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    profile?.secondary_email || 'Not provided'
                  )}
                </td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Department</td>
                <td>{profile?.department}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Year</td>
                <td>{profile?.year}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Semester</td>
                <td>{profile?.semester}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Date of Birth</td>
                <td>{profile?.date_of_birth}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Gender</td>
                <td>{profile?.gender || 'Not provided'}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Blood Group</td>
                <td>{profile?.blood_group || 'Not provided'}</td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Phone Number</td>
                <td>
                  {editMode ? (
                    <input
                      type="text"
                      name="phone"
                      className="form-input"
                      value={editProfile.phone || ''}
                      onChange={handleProfileChange}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    profile?.phone || 'Not provided'
                  )}
                </td>
              </tr>
              <tr>
                <td className="font-semibold" style={{ padding: '12px 8px' }}>Address</td>
                <td>
                  {editMode ? (
                    <textarea
                      name="address"
                      className="form-input"
                      value={editProfile.address || ''}
                      onChange={handleProfileChange}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    profile?.address || 'Not provided'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Guardians Table */}
      <div className="card mt-8" style={{ maxWidth: 800, margin: '0 auto', padding: 0 }}>
        <div style={{ background: '#a6192e', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: '1.2rem 2rem 1rem 2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 0 }}>Guardians</h2>
        </div>
        <div style={{ padding: '2rem' }}>
          {editMode ? (
            <>
              <table style={{ width: '100%', fontSize: '1.05rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Contact</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Relation</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {editGuardians.map((g, idx) => (
                    <tr key={g.id || idx}>
                      <td style={{ padding: '10px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={g.guardian_name}
                          onChange={e => handleGuardianChange(idx, 'guardian_name', (e.target as any).value)}
                        />
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={g.guardian_contact}
                          onChange={e => handleGuardianChange(idx, 'guardian_contact', (e.target as any).value)}
                        />
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={g.relation}
                          onChange={e => handleGuardianChange(idx, 'relation', (e.target as any).value)}
                        />
                      </td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => handleDeleteGuardian(idx)} type="button">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {/* New Guardian Row */}
                  <tr>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Name"
                        value={newGuardian.guardian_name || ''}
                        onChange={e => handleNewGuardianChange('guardian_name', (e.target as any).value)}
                      />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contact"
                        value={newGuardian.guardian_contact || ''}
                        onChange={e => handleNewGuardianChange('guardian_contact', (e.target as any).value)}
                      />
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Relation"
                        value={newGuardian.relation || ''}
                        onChange={e => handleNewGuardianChange('relation', (e.target as any).value)}
                      />
                    </td>
                    <td>
                      <button className="btn" type="button" onClick={handleAddGuardian} style={{ background: '#a6192e', color: '#fff', fontWeight: 600, fontSize: '1rem', borderRadius: 8 }}>Add</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            guardians.length === 0 ? (
              <p className="text-gray-600">No guardians listed for this student.</p>
            ) : (
              <table style={{ width: '100%', fontSize: '1.05rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Contact</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', color: '#a6192e' }}>Relation</th>
                  </tr>
                </thead>
                <tbody>
                  {guardians.map((g) => (
                    <tr key={g.id}>
                      <td style={{ padding: '10px 8px' }}>{g.guardian_name}</td>
                      <td style={{ padding: '10px 8px' }}>{g.guardian_contact}</td>
                      <td style={{ padding: '10px 8px' }}>{g.relation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
      {/* Edit Profile Button and Note, Save/Cancel in edit mode */}
      <div style={{ maxWidth: 800, margin: '2rem auto 0 auto', textAlign: 'center' }}>
        {!editMode && (
          <>
            <button
              className="btn"
              style={{ background: '#a6192e', color: '#fff', fontWeight: 600, fontSize: '1.1rem', borderRadius: 10, minWidth: 140, minHeight: 44, marginBottom: 12 }}
              onClick={handleEdit}
            >
              Edit Profile
            </button>
            <div style={{ color: '#a6192e', fontSize: '0.98rem', marginTop: 4 }}>
              Only select details can be changed from the portal. To change the remaining details, contact your department office.
            </div>
          </>
        )}
        {editMode && (
          <div className="flex gap-4 mt-6" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={handleSave} disabled={loading} style={{ background: '#a6192e', color: '#fff', fontWeight: 600, fontSize: '1.1rem', borderRadius: 10, minWidth: 140, minHeight: 44 }}>Save</button>
            <button className="btn btn-secondary" onClick={handleCancel} disabled={loading} style={{ fontWeight: 600, fontSize: '1.1rem', borderRadius: 10, minWidth: 140, minHeight: 44 }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 