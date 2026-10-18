import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  FileText, 
  FileSpreadsheet, 
  Award, 
  Lock, 
  Sparkles, 
  Cpu, 
  ChevronRight, 
  Search, 
  Filter, 
  Info,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import StarBorder from './StarBorder';

export default function ExecutiveVerificationTab({
  project,
  role = 'executive',
  onBackToOverview,
  onSelectRequirement
}) {
  const [suiteData, setSuiteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  
  // Executive Certification form state
  const [approverName, setApproverName] = useState('Senior VP of Systems / Executive Lead');
  const [certNotes, setCertNotes] = useState('Formally approved for baseline specification release. All test suites verified on Qualcomm Cloud AI 100.');
  const [certifying, setCertifying] = useState(false);
  const [certSuccess, setCertSuccess] = useState(false);

  useEffect(() => {
    if (project?.project_id) {
      loadMasterTestSuite();
    }
  }, [project?.project_id]);

  const loadMasterTestSuite = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMasterTestSuite(project.project_id, role);
      setSuiteData(data);
    } catch (err) {
      console.error('Failed to load master test suite:', err);
      setError(err.message || 'Could not fetch master test cases suite.');
    } finally {
      setLoading(false);
    }
  };

  const handleCertify = async (e) => {
    e.preventDefault();
    if (!approverName.trim()) {
      alert('Please enter the Executive Approver Name.');
      return;
    }

    setCertifying(true);
    try {
      await api.executiveCertifyProject(
        project.project_id,
        approverName.trim(),
        certNotes.trim(),
        role
      );
      setCertSuccess(true);
      await loadMasterTestSuite();
      setTimeout(() => setCertSuccess(false), 4000);
    } catch (err) {
      alert(`Executive Certification Failed: ${err.message}`);
    } finally {
      setCertifying(false);
    }
  };

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A857C' }}>
        Select a workspace to view Executive Baseline Certification.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px', 
        gap: '16px' 
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #E5E0D5', 
          borderTopColor: '#181715', 
          borderRadius: '50%', 
          animation: 'spin 0.8s linear infinite' 
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#181715' }}>
            Compiling Master Test Suite & Verification Blueprints...
          </div>
          <div style={{ fontSize: '12px', color: '#78716C', marginTop: '4px' }}>
            Qualcomm Cloud AI 100 • Llama-3.3-70B synthesis
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cream-card" style={{ padding: '24px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
        <AlertTriangle size={36} color="#DC2626" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#181715', marginBottom: '8px' }}>
          Unable to Load Executive Suite
        </h3>
        <p style={{ fontSize: '13px', color: '#55524B', marginBottom: '16px' }}>{error}</p>
        <button onClick={loadMasterTestSuite} className="btn-subtle-cream">
          Retry Verification
        </button>
      </div>
    );
  }

  const isAllLocked = suiteData?.is_all_locked;
  const lockedCount = suiteData?.locked_count || 0;
  const totalCount = suiteData?.total_requirements || 0;
  const pendingCount = suiteData?.pending_count || 0;
  const isCertified = suiteData?.executive_certified;
  const testSuite = suiteData?.test_suite || [];

  // Filter test suite
  const filteredSuite = testSuite.filter(item => {
    const matchesSearch = 
      item.requirement_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (methodFilter === 'ALL') return true;
    return (item.verification_method || '').toUpperCase() === methodFilter;
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      maxWidth: '1100px', 
      margin: '0 auto', 
      width: '100%', 
      paddingBottom: '48px' 
    }}>
      {/* 1. Header Banner */}
      <div 
        className="cream-card"
        style={{
          padding: '24px',
          background: isAllLocked 
            ? 'linear-gradient(135deg, #FAF8F5 0%, #F5EFEB 100%)' 
            : 'linear-gradient(135deg, #FFFDF8 0%, #FEF3C7 100%)',
          border: isAllLocked ? '1px solid #D6CEBE' : '1px solid #FDE68A',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: isAllLocked ? '#DCFCE7' : '#FEF3C7',
                color: isAllLocked ? '#15803D' : '#B45309',
                border: isAllLocked ? '1px solid #BBF7D0' : '1px solid #FDE68A'
              }}>
                {isAllLocked ? 'All Requirements Verified & Locked' : 'Executive Review Shield Active'}
              </span>
              <span style={{ fontSize: '11px', color: '#78716C', fontFamily: 'var(--font-mono)' }}>
                {project.domain || 'Systems Engineering'}
              </span>
            </div>
            
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#181715', margin: 0, letterSpacing: '-0.02em' }}>
              {isAllLocked ? 'Executive Master Test Cases & Baseline Certification' : 'Baseline Readiness Gatekeeper'}
            </h1>
            <p style={{ fontSize: '13px', color: '#55524B', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
              {isAllLocked 
                ? 'All requirement statements have achieved Lead Systems Engineer technical sign-off. The complete falsifiable test suite is synthesized and ready for formal Senior Executive certification.'
                : 'ISO 26262 & ARP4754A Dual-Key Governance shields executive approval until 100% of requirements have completed technical sign-off by the Lead Systems Engineer.'}
            </p>
          </div>

          {/* Export Quick Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => api.downloadCsv(project.project_id, role)}
              className="btn-subtle-cream"
              style={{ fontSize: '12px', padding: '7px 12px' }}
              title="Export RFC 4180 CSV baseline"
            >
              <FileSpreadsheet size={14} /> Export CSV
            </button>
            <button
              onClick={() => api.downloadPdf(project.project_id, role)}
              className="btn-primary-cream"
              style={{ fontSize: '12px', padding: '7px 14px' }}
              title="Generate Publication-Grade Specification PDF"
            >
              <FileDown size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* Metric Progress Bar */}
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #E5E0D5', 
          borderRadius: '8px', 
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ fontWeight: 600, color: '#181715' }}>
              Lead Systems Engineer Sign-Off Progress
            </span>
            <span style={{ fontWeight: 700, color: isAllLocked ? '#15803D' : '#B45309' }}>
              {lockedCount} of {totalCount} Requirements Locked ({totalCount > 0 ? Math.round((lockedCount / totalCount) * 100) : 0}%)
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', backgroundColor: '#F0ECE1', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${totalCount > 0 ? (lockedCount / totalCount) * 100 : 0}%`,
                backgroundColor: isAllLocked ? '#10B981' : '#F59E0B',
                transition: 'width 0.4s ease'
              }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#78716C' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} color="#15803D" />
              <span>{lockedCount} Technical Sign-Offs Complete</span>
            </span>
            {pendingCount > 0 && (
              <span style={{ color: '#B45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} />
                <span>{pendingCount} Requirement{pendingCount === 1 ? '' : 's'} Pending Sign-Off</span>
              </span>
            )}
            {pendingCount === 0 && (
              <span style={{ color: '#15803D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Gate Cleared: Ready for Executive Seal</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CASE A: Gate Blocked (Not all locked) */}
      {!isAllLocked && (
        <div 
          className="cream-card" 
          style={{ 
            padding: '28px', 
            borderRadius: '12px', 
            border: '1px solid #E5E0D5',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px', 
              backgroundColor: '#FEF3C7', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#B45309'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#181715', margin: 0 }}>
                Executive Master Test Suite Locked
              </h3>
              <p style={{ fontSize: '12.5px', color: '#55524B', margin: 0 }}>
                The following {pendingCount} requirement(s) must be reviewed and signed off by the Lead Systems Engineer before the baseline test matrix can be released.
              </p>
            </div>
          </div>

          <div style={{ 
            padding: '16px', 
            backgroundColor: '#FAF8F5', 
            border: '1px solid #E5E0D5', 
            borderRadius: '8px',
            fontSize: '12.5px',
            color: '#57534E',
            lineHeight: 1.6
          }}>
            <strong>Why is this gated?</strong> Under dual-key safety governance, Senior Management and Executives sign off on concrete, falsifiable engineering blueprints rather than speculative drafts. Once the Lead Systems Engineer validates hardware feasibility and signs off on all provisional values, Qualcomm Cloud AI 100 generates the unified master verification blueprint.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onBackToOverview}
              className="btn-subtle-cream"
              style={{ fontSize: '12px' }}
            >
              Return to Workspace Overview
            </button>
          </div>
        </div>
      )}

      {/* 3. CASE B: All Requirements Locked -> Master Test Cases Suite & Executive Certification */}
      {isAllLocked && (
        <>
          {/* Executive Certification Seal or Sign-Off Deck */}
          <div 
            className="cream-card"
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: isCertified ? '2px solid #10B981' : '1px solid #D6CEBE',
              background: isCertified 
                ? 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)' 
                : '#FFFFFF',
              boxShadow: isCertified ? '0 4px 16px rgba(16, 185, 129, 0.08)' : 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px', 
                  backgroundColor: isCertified ? '#DCFCE7' : '#F5EFEB', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: isCertified ? '#15803D' : '#181715'
                }}>
                  <Award size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#181715', margin: 0 }}>
                      {isCertified ? 'Official Executive Certified Baseline' : 'Executive Baseline Certification Form'}
                    </h2>
                    {isCertified && (
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        backgroundColor: '#10B981', 
                        color: '#FFFFFF', 
                        padding: '2px 8px', 
                        borderRadius: '4px' 
                      }}>
                        SEALED & CERTIFIED
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#55524B', margin: '2px 0 0 0' }}>
                    {isCertified 
                      ? 'The master baseline has received formal Senior Executive certification. Blueprints are locked for production release.'
                      : 'As Senior Executive / Senior Manager, review the synthesized test cases below and apply your final signature to seal the specification.'}
                  </p>
                </div>
              </div>

              {isCertified && (
                <div style={{ 
                  textAlign: 'right', 
                  fontSize: '11.5px', 
                  color: '#15803D', 
                  backgroundColor: '#DCFCE7', 
                  padding: '8px 12px', 
                  borderRadius: '6px',
                  border: '1px solid #BBF7D0'
                }}>
                  <div><strong>Certified By:</strong> {suiteData.executive_certified_by}</div>
                  <div><strong>Timestamp:</strong> {new Date(suiteData.executive_certified_at).toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Certification Details or Form */}
            {isCertified ? (
              <div style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #BBF7D0', 
                borderRadius: '8px', 
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>
                  Senior Executive Release Directives & Notes:
                </div>
                <div style={{ fontSize: '13px', color: '#181715', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{suiteData.executive_notes || 'No specific release directives recorded.'}"
                </div>
              </div>
            ) : (
              <form onSubmit={handleCertify} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#55524B', marginBottom: '4px' }}>
                      Executive Approver Name & Title
                    </label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      required
                      placeholder="e.g. Dr. Jane Smith, VP Systems"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #D6CEBE',
                        borderRadius: '6px',
                        backgroundColor: '#FAF8F5'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#55524B', marginBottom: '4px' }}>
                      Release Directives & Certification Notes
                    </label>
                    <input
                      type="text"
                      value={certNotes}
                      onChange={(e) => setCertNotes(e.target.value)}
                      placeholder="e.g. Approved for production build. Test matrices validated on AI100."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #D6CEBE',
                        borderRadius: '6px',
                        backgroundColor: '#FAF8F5'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                  <div style={{ fontSize: '11.5px', color: '#78716C' }}>
                    Signing certifies all {totalCount} requirements and binds the paired nominal & boundary test cases.
                  </div>
                  <button
                    type="submit"
                    disabled={certifying}
                    className="btn-primary-cream"
                    style={{ 
                      padding: '8px 18px', 
                      fontSize: '13px', 
                      fontWeight: 700,
                      backgroundColor: '#181715',
                      color: '#FAF8F5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {certifying ? (
                      <>
                        <div style={{ width: '14px', height: '14px', border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Certifying Baseline...
                      </>
                    ) : (
                      <>
                        <Award size={16} /> Certify & Seal Master Baseline
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {certSuccess && (
              <div style={{ 
                padding: '10px 14px', 
                backgroundColor: '#DCFCE7', 
                border: '1px solid #86EFAC', 
                borderRadius: '6px', 
                fontSize: '12.5px', 
                color: '#15803D',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} /> Master Baseline successfully certified by Senior Executive!
              </div>
            )}
          </div>

          {/* Master Test Cases Search & Filter Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#181715', margin: 0 }}>
                Synthesized Verification Blueprints ({filteredSuite.length} of {testSuite.length})
              </h3>
              <span style={{ fontSize: '11px', color: '#78716C', fontFamily: 'var(--font-mono)' }}>
                Powered by Llama-3.3-70B
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }} />
                <input
                  type="text"
                  placeholder="Filter test cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 10px 6px 30px',
                    fontSize: '12px',
                    border: '1px solid #E5E0D5',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    width: '180px'
                  }}
                />
              </div>

              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  border: '1px solid #E5E0D5',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#181715',
                  fontWeight: 500
                }}
              >
                <option value="ALL">All Methods</option>
                <option value="TEST">Test</option>
                <option value="DEMONSTRATION">Demonstration</option>
                <option value="ANALYSIS">Analysis</option>
                <option value="INSPECTION">Inspection</option>
              </select>
            </div>
          </div>

          {/* Test Case Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredSuite.map((item, index) => {
              const posTest = item.positive_test_case || {};
              const negTest = item.negative_boundary_test_case || {};

              return (
                <div 
                  key={item.requirement_id || index}
                  className="cream-card"
                  style={{
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #E5E0D5',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        color: '#181715',
                        backgroundColor: '#F5EFEB',
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        {item.requirement_id}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#55524B', fontWeight: 600 }}>
                        {item.category} • {item.section}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #DBEAFE'
                      }}>
                        {item.verification_method || 'TEST'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#78716C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#15803D" />
                      <span>Approved by: <strong>{item.technical_approver || 'Lead Systems Engineer'}</strong></span>
                    </div>
                  </div>

                  {/* Requirement Statement */}
                  <div style={{ 
                    padding: '12px 14px', 
                    backgroundColor: '#FAF8F5', 
                    border: '1px solid #EFEAE2', 
                    borderRadius: '6px',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    color: '#181715',
                    lineHeight: 1.5
                  }}>
                    {item.statement}
                  </div>

                  {/* Preconditions */}
                  {item.preconditions && (
                    <div style={{ fontSize: '12px', color: '#57534E', display: 'flex', gap: '6px' }}>
                      <strong style={{ color: '#181715' }}>Preconditions:</strong>
                      <span>{item.preconditions}</span>
                    </div>
                  )}

                  {/* Paired Nominal & Boundary Test Cases */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                    
                    {/* 1. Nominal / Positive Test Case */}
                    <div style={{ 
                      backgroundColor: '#F0FDF4', 
                      border: '1px solid #DCFCE7', 
                      borderRadius: '8px', 
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={13} color="#15803D" />
                          <span>Nominal Test Case (Positive)</span>
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#15803D' }}>{posTest.id || 'TC-POS'}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#14532D' }}>
                        {posTest.description || 'Valid operational range verification'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#166534' }}>
                        <strong>Stimulus:</strong> {posTest.stimulus || posTest.test_inputs || 'Nominal inputs'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#166534' }}>
                        <strong>Expected:</strong> {posTest.expected_response || posTest.expected_outputs || 'Within specified boundary'}
                      </div>
                    </div>

                    {/* 2. Boundary / Stress Test Case */}
                    <div style={{ 
                      backgroundColor: '#FEF2F2', 
                      border: '1px solid #FEE2E2', 
                      borderRadius: '8px', 
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <ShieldAlert size={13} color="#B91C1C" />
                          <span>Boundary / Stress Test (Negative)</span>
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#B91C1C' }}>{negTest.id || 'TC-BOUND'}</span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#7F1D1D' }}>
                        {negTest.description || 'Extreme limits & stress threshold verification'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#991B1B' }}>
                        <strong>Boundary Trigger:</strong> {negTest.boundary_value || negTest.stimulus || 'Edge value at boundary threshold'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#991B1B' }}>
                        <strong>Safety Margin:</strong> {negTest.expected_safe_response || negTest.expected_response || 'Fail-safe state triggered'}
                      </div>
                    </div>
                  </div>

                  {/* Falsifiable Pass / Fail Acceptance Criteria */}
                  <div style={{ 
                    backgroundColor: '#FAF8F5', 
                    border: '1px solid #E5E0D5', 
                    borderRadius: '6px', 
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#181715' }}>Falsifiable PASS/FAIL Criteria:</strong>
                      <span style={{ color: '#44403C' }}>
                        {item.acceptance_criteria || 'Deterministic pass/fail thresholds defined and verified.'}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectRequirement(item.requirement_id)}
                      className="btn-subtle-cream"
                      style={{ fontSize: '11px', padding: '4px 8px', border: 'none', background: 'transparent' }}
                      title="Inspect full requirement details"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
