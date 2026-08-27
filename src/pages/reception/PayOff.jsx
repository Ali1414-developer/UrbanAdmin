import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { showToast } from '../../components/Toast';
import {
  Wallet, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2,
  Clock, Printer, Receipt, Building2, MapPin, CreditCard,
  Download, Calendar, ShieldCheck, UserCheck, X, FileText
} from 'lucide-react';

const formatRs = (n) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;

export default function ReceptionPayOff() {
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const printRef = useRef(null);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reception/my-payroll');
      setPayroll(res.data.data);
    } catch (err) {
      showToast('Failed to load salary & payroll data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handlePrintSlip = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-overlay" style={{ padding: '80px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Wallet size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <h3>Payroll Information Unavailable</h3>
        <p>Could not retrieve your salary details. Please contact your Branch Administrator.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wallet size={26} color="var(--accent)" />
            Staff Compensation & Monthly Pay-Off
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            View your monthly salary breakdown, disbursements, and official payslips.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSelectedSlip({
              month: payroll.currentMonth,
              baseSalary: payroll.baseSalary,
              allowance: payroll.allowance,
              bonus: payroll.bonus,
              deductions: payroll.deductions,
              netPay: payroll.netPay,
              status: payroll.payStatus,
              paidAt: payroll.lastPaidDate,
              transactionRef: `UB-PAY-${Date.now().toString().slice(-6)}`
            })}
          >
            <Printer size={15} /> View / Print Current Payslip
          </button>
        </div>
      </div>

      {/* Top Banner / Active Status */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)'
          }}>
            {payroll.staffName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {payroll.staffName}
              </h2>
              <span className="badge badge-purple" style={{ fontSize: 11 }}>
                {payroll.role}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} color="var(--accent)" /> {payroll.branchName} ({payroll.city})
              </span>
              <span>•</span>
              <span>{payroll.staffEmail}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Current Cycle ({payroll.currentMonth})
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: payroll.payStatus === 'Paid' ? 'var(--green)' : 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
              {payroll.payStatus === 'Paid' ? <CheckCircle2 size={15} color="var(--green)" /> : <Clock size={15} color="var(--yellow)" />}
              <span>{payroll.payStatus === 'Paid' ? 'Disbursed / Paid' : 'Pending Processing'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Salary Breakdown Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {/* Base Salary */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Monthly Base Salary</div>
            <div className="stat-value">{formatRs(payroll.baseSalary)}</div>
            <div className="stat-hint" style={{ color: 'var(--text-muted)' }}>Contracted base pay</div>
          </div>
        </div>

        {/* Allowances */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <ArrowUpRight size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Allowances</div>
            <div className="stat-value" style={{ color: '#10B981' }}>+ {formatRs(payroll.allowance)}</div>
            <div className="stat-hint" style={{ color: 'var(--text-muted)' }}>Food & Travel allowance</div>
          </div>
        </div>

        {/* Bonus */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <ArrowUpRight size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Performance Bonus</div>
            <div className="stat-value" style={{ color: '#F59E0B' }}>+ {formatRs(payroll.bonus)}</div>
            <div className="stat-hint" style={{ color: 'var(--text-muted)' }}>Branch target reward</div>
          </div>
        </div>

        {/* Net Monthly Take-Home */}
        <div className="stat-card" style={{ border: '2px solid var(--accent)', background: 'rgba(229, 57, 53, 0.02)' }}>
          <div className="stat-icon" style={{ background: 'var(--accent)', color: '#fff' }}>
            <Wallet size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label" style={{ color: 'var(--accent)', fontWeight: 700 }}>Total Net Pay</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{formatRs(payroll.netPay)}</div>
            <div className="stat-hint" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Take-home compensation</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Bank Info & Salary Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Salary Component Breakdown Table */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--accent)" /> Earnings & Deductions Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Basic Base Salary</span>
              <span style={{ fontWeight: 700 }}>{formatRs(payroll.baseSalary)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Meal & Travel Allowance</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>+ {formatRs(payroll.allowance)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Branch Bonus / Incentive</span>
              <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>+ {formatRs(payroll.bonus)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Taxes & Advance Deductions</span>
              <span style={{ fontWeight: 700, color: 'var(--red)' }}>- {formatRs(payroll.deductions)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: 15, fontWeight: 800 }}>
              <span>Total Monthly Payout</span>
              <span style={{ color: 'var(--accent)', fontSize: 17 }}>{formatRs(payroll.netPay)}</span>
            </div>
          </div>
        </div>

        {/* Bank & Disbursement Details */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={16} color="#2563EB" /> Disbursement & Bank Information
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Name</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{payroll.bankName}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>IBAN / Account Number</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'monospace', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                {payroll.accountNumber}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Title</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{payroll.accountTitle}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disbursement Method</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{payroll.paymentMethod}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Payslip History Table */}
      <div className="card">
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="var(--accent)" /> Past Monthly Payslips & Disbursements
          </h3>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payroll Month</th>
                <th>Base Salary</th>
                <th>Allowances & Bonus</th>
                <th>Deductions</th>
                <th>Net Payout</th>
                <th>Disbursement Status</th>
                <th>Date Paid</th>
                <th>Reference #</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(payroll.payHistory) && payroll.payHistory.length > 0 ? (
                payroll.payHistory.map((h, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        {h.month || '—'}
                      </div>
                    </td>
                    <td>{formatRs(h.baseSalary)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                      + {formatRs((h.allowance || 0) + (h.bonus || 0))}
                    </td>
                    <td style={{ color: 'var(--red)' }}>
                      - {formatRs(h.deductions || 0)}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--accent)' }}>
                      {formatRs(h.netPay)}
                    </td>
                    <td>
                      <span className={`badge ${h.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>
                        {h.status || 'Paid'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {h.paidAt ? new Date(h.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                      {h.transactionRef || '—'}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedSlip(h)}
                        title="View & Print Official Payslip"
                      >
                        <Printer size={13} /> Payslip
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    <Receipt size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div>No prior monthly pay-off records found in database.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Official Printable Payslip Modal ── */}
      {selectedSlip && (
        <div className="modal-overlay" onClick={() => setSelectedSlip(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={18} color="var(--accent)" /> Official Salary Payslip
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={handlePrintSlip}>
                  <Printer size={14} /> Print
                </button>
                <button type="button" className="btn-icon btn-sm" onClick={() => setSelectedSlip(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '16px 24px 24px' }}>
              <div className="pos-receipt" ref={printRef} style={{ maxWidth: '100%', margin: '0 auto', background: '#fff', color: '#111', padding: 20, borderRadius: 8, border: '1px solid #ddd' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #222', paddingBottom: 12, marginBottom: 16 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>UrbanBite Pakistan</h2>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#444', marginTop: 2 }}>EMPLOYEE SALARY DISBURSEMENT SLIP</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{payroll.branchName} • {payroll.city}</div>
                </div>

                {/* Employee Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ color: '#666', fontSize: 10, textTransform: 'uppercase' }}>Employee Name</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{payroll.staffName}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: 10, textTransform: 'uppercase' }}>Designation / Role</div>
                    <div style={{ fontWeight: 700 }}>{payroll.role}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: 10, textTransform: 'uppercase' }}>Pay Period</div>
                    <div style={{ fontWeight: 700 }}>{selectedSlip.month}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: 10, textTransform: 'uppercase' }}>Disbursement Date</div>
                    <div style={{ fontWeight: 700 }}>{selectedSlip.paidAt ? new Date(selectedSlip.paidAt).toLocaleDateString('en-GB') : '—'}</div>
                  </div>
                </div>

                {/* Earnings Table */}
                <div style={{ fontSize: 12, marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: '#444', marginBottom: 6 }}>Earnings & Deductions</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Basic Base Salary:</span>
                    <span>Rs. {(selectedSlip.baseSalary || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Allowances:</span>
                    <span>Rs. {(selectedSlip.allowance || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Performance Incentive / Bonus:</span>
                    <span>Rs. {(selectedSlip.bonus || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#c00' }}>
                    <span>Tax & Advance Deductions:</span>
                    <span>- Rs. {(selectedSlip.deductions || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #222', borderBottom: '2px solid #222', fontWeight: 900, fontSize: 15, marginTop: 8 }}>
                    <span>NET TAKE-HOME PAY:</span>
                    <span>Rs. {(selectedSlip.netPay || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Bank Ref */}
                <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>
                  <div><strong>Payment Mode:</strong> {payroll.paymentMethod}</div>
                  <div><strong>Bank:</strong> {payroll.bankName} (Acct: {payroll.accountNumber})</div>
                  <div><strong>Transaction Reference:</strong> {selectedSlip.transactionRef || 'UB-REF-AUTO'}</div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px dashed #ccc', fontSize: 10, color: '#666' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 120, borderBottom: '1px solid #999', marginBottom: 4 }} />
                    Employee Signature
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 120, borderBottom: '1px solid #999', marginBottom: 4 }} />
                    Authorized Finance Officer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
