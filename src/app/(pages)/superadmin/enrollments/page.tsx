'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Enrollment, Pagination, ApiResponse } from '@/types/enrollment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchEnrollments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}api/users`, {
        params: {
          page: page,
          limit: 10
        }
      });

      if (response.data.status === 'success') {
        setEnrollments(response.data.data.data);
        setPagination(response.data.data.pagination);
      } else {
        setError('Failed to fetch enrollments');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>User Enrollments</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          color: '#c00', 
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        flexWrap: 'wrap' 
      }}>
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '1rem',
          borderRadius: '8px',
          minWidth: '200px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Total Enrollments</h3>
          <p style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold' }}>{pagination.total}</p>
        </div>
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '1rem',
          borderRadius: '8px',
          minWidth: '200px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Current Page</h3>
          <p style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold' }}>
            {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '1rem',
          borderRadius: '8px',
          minWidth: '200px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Paid Enrollments</h3>
          <p style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold', color: '#4caf50' }}>
            {enrollments.filter(e => e.paymentId).length}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#666'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>Loading enrollments...</div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      ) : enrollments.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px dashed #ddd'
        }}>
          No enrollments found
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#555',
                    borderBottom: '2px solid #ddd'
                  }}>User</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#555',
                    borderBottom: '2px solid #ddd'
                  }}>Email</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#555',
                    borderBottom: '2px solid #ddd'
                  }}>Course</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#555',
                    borderBottom: '2px solid #ddd'
                  }}>Amount</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#555',
                    borderBottom: '2px solid #ddd'
                  }}>Status</th>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#555',
                    borderBottom: '2px solid #ddd'
                  }}>Enrolled On</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} style={{ 
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: '#f9f9f9'
                    }
                  } as React.CSSProperties}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <strong style={{ color: '#333' }}>{enrollment.user.name || 'N/A'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '0.25rem' }}>
                          User ID: {enrollment.userId.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <a href={`mailto:${enrollment.user.email}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
                        {enrollment.user.email}
                      </a>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <strong style={{ color: '#333' }}>{enrollment.course.title}</strong>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                          {enrollment.course.description}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                          Course ID: {enrollment.courseId.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ 
                        color: enrollment.totalAmount > 0 ? '#1976d2' : '#666',
                        fontSize: '1.1rem'
                      }}>
                        {formatCurrency(enrollment.totalAmount/10000)}
                      </strong>
                      {/* {enrollment.course.price > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          Price: ₹{enrollment.course.price}
                        </div>
                      )} */}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        backgroundColor: enrollment.paymentId ? '#4caf50' : '#757575',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'inline-block'
                      }}>
                        {enrollment.paymentId ? 'Paid' : 'Free'}
                      </span>
                      {enrollment.paymentId && (
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                          {enrollment.paymentId.substring(0, 10)}...
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#666' }}>
                      {formatDate(enrollment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #eee'
            }}>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} enrollments
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => fetchEnrollments(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: pagination.hasPrevPage ? '#1976d2' : '#e0e0e0',
                    color: pagination.hasPrevPage ? 'white' : '#999',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: pagination.hasPrevPage ? '#1565c0' : '#e0e0e0'
                    }
                  } as React.CSSProperties}
                >
                  Previous
                </button>
                
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchEnrollments(pageNum)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: pagination.page === pageNum ? '#1976d2' : 'white',
                          color: pagination.page === pageNum ? 'white' : '#333',
                          border: pagination.page === pageNum ? 'none' : '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: pagination.page === pageNum ? 'bold' : 'normal',
                          minWidth: '40px',
                          transition: 'all 0.2s',
                          ':hover': {
                            backgroundColor: pagination.page === pageNum ? '#1565c0' : '#f5f5f5'
                          }
                        } as React.CSSProperties}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => fetchEnrollments(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: pagination.hasNextPage ? '#1976d2' : '#e0e0e0',
                    color: pagination.hasNextPage ? 'white' : '#999',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: pagination.hasNextPage ? '#1565c0' : '#e0e0e0'
                    }
                  } as React.CSSProperties}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}