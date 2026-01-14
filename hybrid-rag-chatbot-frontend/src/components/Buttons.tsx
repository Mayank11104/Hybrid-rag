// frontend/src/components/Buttons.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, FileSpreadsheet, Loader } from 'lucide-react';
import { getFilesByCategory, deleteFileByCategory } from '../services/api';

type TabKey = 'purchase' | 'hr' | 'finance';

interface ButtonsProps {
  onSelect?: (key: TabKey) => void;
}

interface FileItem {
  file_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  category: string;
  uploaded_at: string;
  description?: string;
}

const Buttons: React.FC<ButtonsProps> = ({ onSelect }) => {
  const [active, setActive] = useState<TabKey | null>(null);  // ← Changed to null initially
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TabKey | null>(null);

  const COLORS = {
    sidebarBg: '#24252D',
    highlight: '#A689FF',
    active: '#8D74DA',
    text: '#FFFFFF',
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    gap: 12,
  };

  const buttonBase: React.CSSProperties = {
    flex: 1,
    height: 46,
    borderRadius: 14,
    border: `1px solid ${COLORS.highlight}55`,
    color: COLORS.text,
    background: `linear-gradient(180deg, ${COLORS.sidebarBg} 0%, #1d1e24 100%)`,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease',
    boxShadow: '0 10px 18px rgba(0,0,0,0.18)',
  };

  const buttonActive: React.CSSProperties = {
    background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.active} 100%)`,
    borderColor: COLORS.highlight,
    boxShadow: '0 14px 30px rgba(166, 137, 255, 0.35)',
    transform: 'translateY(-1px)',
  };

  const shine: React.CSSProperties = {
    position: 'absolute',
    inset: -40,
    background:
      'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.18), transparent 45%)',
    opacity: 0.9,
    pointerEvents: 'none',
    transform: 'rotate(12deg)',
  };

  // Fetch files by category
  const fetchFiles = async (category: TabKey) => {
    setLoading(true);
    try {
      console.log('📥 Fetching files for category:', category);
      const response = await getFilesByCategory(category);
      console.log('✅ Files loaded:', response);
      setFiles(response.files || []);
    } catch (error) {
      console.error('❌ Failed to fetch files:', error);
      alert('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle button click
  const click = async (key: TabKey) => {
    setActive(key);  // Set active button
    onSelect?.(key);
    
    // Open modal and fetch files
    setSelectedCategory(key);
    setShowModal(true);
    await fetchFiles(key);
  };

  // Handle modal close
  const closeModal = () => {
    setShowModal(false);
    setActive(null);  // ← Remove active state when modal closes
    setSelectedCategory(null);
  };

  // Handle file delete
  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting file:', fileId);
      await deleteFileByCategory(fileId);
      console.log('✅ File deleted successfully');
      
      // Refresh file list
      if (selectedCategory) {
        await fetchFiles(selectedCategory);
      }
      
      alert('File deleted successfully!');
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  // Handle file download
  const handleDownload = (file: FileItem) => {
    // TODO: Implement download functionality
    console.log('📥 Download file:', file.original_filename);
    alert(`Download functionality for "${file.original_filename}" will be implemented soon!`);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hoverOn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 16px 32px rgba(166, 137, 255, 0.22)';
    e.currentTarget.style.borderColor = COLORS.highlight;
  };

  const hoverOff = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
    e.currentTarget.style.transform = isActive ? 'translateY(-1px)' : 'translateY(0px)';
    e.currentTarget.style.boxShadow = isActive
      ? '0 14px 30px rgba(166, 137, 255, 0.35)'
      : '0 10px 18px rgba(0,0,0,0.18)';
    e.currentTarget.style.borderColor = isActive ? COLORS.highlight : `${COLORS.highlight}55`;
  };

  return (
    <>
      <div style={containerStyle}>
        <button
          type="button"
          style={{ ...buttonBase, ...(active === 'purchase' && showModal ? buttonActive : {}) }}
          onClick={() => click('purchase')}
          onMouseEnter={hoverOn}
          onMouseLeave={(e) => hoverOff(e, active === 'purchase' && showModal)}
        >
          <span style={shine} />
          Purchase
        </button>

        <button
          type="button"
          style={{ ...buttonBase, ...(active === 'hr' && showModal ? buttonActive : {}) }}
          onClick={() => click('hr')}
          onMouseEnter={hoverOn}
          onMouseLeave={(e) => hoverOff(e, active === 'hr' && showModal)}
        >
          <span style={shine} />
          HR
        </button>

        <button
          type="button"
          style={{ ...buttonBase, ...(active === 'finance' && showModal ? buttonActive : {}) }}
          onClick={() => click('finance')}
          onMouseEnter={hoverOn}
          onMouseLeave={(e) => hoverOff(e, active === 'finance' && showModal)}
        >
          <span style={shine} />
          Finance
        </button>
      </div>

      {/* File List Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}  // ← Updated to use closeModal
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1F2937',
                  margin: 0,
                  textTransform: 'capitalize',
                }}
              >
                {selectedCategory} Files ({files.length})
              </h2>
              <button
                onClick={closeModal}  // ← Updated to use closeModal
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={24} style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* File List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '16px',
              }}
            >
              {loading ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                  }}
                >
                  <Loader
                    size={48}
                    style={{
                      color: COLORS.highlight,
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <p
                    style={{
                      marginTop: '16px',
                      color: '#6B7280',
                      fontSize: '14px',
                    }}
                  >
                    Loading files...
                  </p>
                </div>
              ) : files.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                  }}
                >
                  <FileSpreadsheet
                    size={64}
                    style={{
                      color: '#D1D5DB',
                      margin: '0 auto 16px',
                    }}
                  />
                  <p
                    style={{
                      fontSize: '16px',
                      color: '#6B7280',
                      margin: 0,
                    }}
                  >
                    No files uploaded yet
                  </p>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#9CA3AF',
                      marginTop: '8px',
                    }}
                  >
                    Upload files to see them here
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {files.map((file) => (
                    <div
                      key={file.file_id}
                      style={{
                        padding: '16px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.borderColor = COLORS.highlight;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}
                    >
                      <FileSpreadsheet size={40} style={{ color: COLORS.highlight }} />
                      
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1F2937',
                            margin: '0 0 4px 0',
                          }}
                        >
                          {file.original_filename}
                        </p>
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            margin: 0,
                          }}
                        >
                          {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDownload(file)}
                          style={{
                            padding: '8px',
                            backgroundColor: COLORS.highlight,
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.active;
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.highlight;
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Download size={16} style={{ color: '#FFFFFF' }} />
                        </button>

                        <button
                          onClick={() => handleDelete(file.file_id, file.original_filename)}
                          style={{
                            padding: '8px',
                            backgroundColor: '#EF4444',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#DC2626';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#EF4444';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Trash2 size={16} style={{ color: '#FFFFFF' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default Buttons;
