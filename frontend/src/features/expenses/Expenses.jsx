import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Receipt, Upload, ZoomIn } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { expenseService } from '../../services/serviceFactory.js';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Currency,
  LinkButton,
  Table,
  Details,
  Timeline,
  Modal,
  Notice,
  Empty,
  Loading,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { date } from '../../utils/format.js';
export default function Expenses() {
  const { data, toast } = useApp(),
    { id } = useParams(),
    navigate = useNavigate(),
    location = useLocation(),
    { run, busy } = useAction();
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('ALL'),
    [editing, setEditing] = useState(false),
    [receipt, setReceipt] = useState(''),
    [fileError, setFileError] = useState(null),
    [decision, setDecision] = useState(null),
    [preview, setPreview] = useState(false),
    [zoom, setZoom] = useState(1),
    [draft, setDraft] = useState(false),
    [fetchedExpense, setFetchedExpense] = useState(null),
    [loadingFetched, setLoadingFetched] = useState(false);

  useEffect(() => {
    if (id && !data.expenses.find((exp) => exp.id === id)) {
      setLoadingFetched(true);
      fetch(`/api/ledger/expenses/${id}`, {
        headers: { 'x-club-slug': 'nec-cse' },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            const exp = json.data;
            setFetchedExpense({
              id: exp.id,
              clubId: 'nec-cse',
              budgetId: exp.budget_id,
              eventId: exp.event_id,
              fundraiserId: exp.fundraiser_id,
              userId: exp.claimant_user_id,
              claimantName: exp.claimant_name,
              title: exp.title,
              description: exp.description,
              purpose: exp.description || exp.title,
              category: exp.category,
              merchant: exp.merchant_name,
              amount: exp.amount_cents,
              receipt: exp.receipt_image_url,
              status: exp.status,
              disbursementMethod: exp.disbursement_method,
              purchaseDate: exp.purchase_date || exp.created_at,
              createdAt: exp.created_at,
              updatedAt: exp.updated_at,
              history: [
                { action: 'SUBMITTED', status: 'SUBMITTED', at: exp.created_at, actorId: exp.claimant_user_id },
                ...(exp.status !== 'SUBMITTED'
                  ? [{ action: exp.status, status: exp.status, at: exp.updated_at || exp.created_at }]
                  : []),
              ],
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoadingFetched(false));
    }
  }, [id, data.expenses]);

  const isNew = location.pathname.endsWith('/new'),
    management = location.pathname.startsWith('/dashboard'),
    storeExpense = id ? data.expenses.find((exp) => exp.id === id) : null,
    e = storeExpense || fetchedExpense;

  async function fileSelected(file) {
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      setFileError('Choose a PNG, JPEG, WebP or PDF receipt up to 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceipt(reader.result);
      setFileError(null);
    };
    reader.readAsDataURL(file);
  }

  if (id && !e) {
    if (loadingFetched) return <Loading />;
    return <Empty title="Expense claim not found" description="The requested expense record could not be found." />;
  }
  const fields = [
    { name: 'title', label: 'Expense title', required: true },
    { name: 'merchant', label: 'Merchant', required: true },
    { name: 'purchaseDate', label: 'Purchase date', type: 'date', required: true },
    { name: 'amount', label: 'Amount (₹)', type: 'number', step: '.01', required: true },
    {
      name: 'category',
      label: 'Category',
      required: true,
      options: ['EVENT_PRODUCTION', 'SUPPLIES', 'FOOD_CATERING', 'MARKETING', 'TRAVEL', 'OTHER'],
    },
    {
      name: 'budgetId',
      label: 'Budget envelope',
      options: (data.budgetCatalog || data.budgets || []).map((b) => ({ value: b.id, label: b.title })),
    },
    {
      name: 'eventId',
      label: 'Event association',
      options: data.events.map((e) => ({ value: e.id, label: e.title })),
    },
    {
      name: 'fundraiserId',
      label: 'Fundraiser association',
      options: data.fundraisers.map((f) => ({ value: f.id, label: f.title })),
    },
    { name: 'purpose', label: 'Purpose and details', type: 'textarea', required: true, full: true },
  ];
  const form = (
    <Card>
      <div className="card-body stack">
        <Notice>
          Upload receipt proof and enter your expense details. Claims of ₹2,500 or more require two
          independent approvals. No OCR or real payout is performed.
        </Notice>
        <RecordForm
          fields={fields}
          initial={
            e
              ? { ...e, amount: e.amount / 100 }
              : { purchaseDate: new Date(data.clock).toISOString().slice(0, 10) }
          }
          onCancel={() => {
            if (editing) setEditing(false);
            else navigate('/portal/expenses');
          }}
          submitLabel={draft ? 'Save draft' : 'Submit expense claim'}
          onSubmit={async (v) => {
            const record = await expenseService.save({
              ...v,
              id: e?.id,
              amount: Math.round(Number(v.amount) * 100),
              receipt: receipt || e?.receipt,
              draft,
            });
            toast(draft ? 'Expense draft saved' : 'Expense claim submitted');
            setEditing(false);
            navigate(`/portal/expenses/${record.id}`);
          }}
        >
          <div className="field" style={{ marginTop: 24 }}>
            <label htmlFor="receipt-file">Receipt proof {draft ? '' : '*'}</label>
            <div
              className="receipt"
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={(ev) => {
                ev.preventDefault();
                fileSelected(ev.dataTransfer.files[0]);
              }}
            >
              <input
                id="receipt-file"
                className="file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(ev) => fileSelected(ev.target.files[0])}
              />
              <p className="caption muted">
                Drop an image or PDF here, or choose a file. Up to 3 MB. Attached as official reimbursement proof.
              </p>
              {(receipt || e?.receipt) && <p>Receipt attached</p>}
              {fileError && <Notice tone="error">{fileError}</Notice>}
            </div>
          </div>
          <label className="checkbox-label" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={draft} onChange={(ev) => setDraft(ev.target.checked)} />
            Save as draft without submitting
          </label>
        </RecordForm>
      </div>
    </Card>
  );
  return (
    <div className="stack">
      <PageHeader
        title={
          isNew
            ? 'A simple way to get paid back.'
            : editing
              ? 'Correct your expense claim'
              : e
                ? e.title
                : management
                  ? 'Expense review desk'
                  : 'My expense claims'
        }
        description={
          isNew
            ? 'A receipt, a few details and a clear path to reimbursement.'
            : 'Clear decisions. Independent approvals. Every rupee accounted for.'
        }
      >
        {!isNew && !e && data.role !== 'AUDITOR' && (
          <LinkButton primary to="/portal/expenses/new">
            <Receipt size={16} />
            Submit an expense
          </LinkButton>
        )}
      </PageHeader>
      {isNew || editing ? (
        form
      ) : e ? (
        <>
          <div className="grid two">
            <Card title="Claim details">
              <div className="card-body stack">
                <Badge value={e.status} />
                <Details
                  items={[
                    ['Reference', <span className="mono">{e.id}</span>],
                    ['Claimant', data.users.find((u) => u.id === e.userId)?.name || e.claimantName || 'CSE Association Officer'],
                    ['Merchant', e.merchant || e.merchantName || 'Campus Operations'],
                    ['Purchase date', date(e.purchaseDate || e.createdAt)],
                    ['Amount', <Currency amount={e.amount} />],
                    ['Category', (e.category || 'GENERAL').replaceAll('_', ' ')],
                    ['Budget', (data.budgetCatalog || data.budgets || []).find((b) => b.id === e.budgetId)?.title || 'General Operations'],
                    [
                      'Approval policy',
                      e.amount >= 250000 ? 'Treasurer + Association In-charge' : 'Treasurer final approval',
                    ],
                  ]}
                />
                <p>{e.purpose || e.description}</p>
                {e.reason && (
                  <Notice tone={e.status === 'REJECTED' ? 'error' : 'warning'}>
                    Reviewer feedback: {e.reason}
                  </Notice>
                )}
                {e.userId === data.user.id && ['DRAFT', 'NEEDS_CORRECTION'].includes(e.status) && (
                  <Button primary onClick={() => setEditing(true)}>
                    Correct & resubmit
                  </Button>
                )}
                {e.userId === data.user.id && ['TREASURER', 'ASSOCIATION_INCHARGE'].includes(data.role) && (
                  <Notice tone="warning">
                    You cannot approve your own claim. Ask an independent officer to review.
                  </Notice>
                )}
                {['TREASURER', 'ASSOCIATION_INCHARGE'].includes(data.role) && e.userId !== data.user.id && (
                  <div className="row">
                    {e.status === 'SUBMITTED' && (
                      <Button
                        primary
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => expenseService.decision({ expenseId: e.id, decision: 'review' }),
                            'Claim opened for review',
                          )
                        }
                      >
                        Begin review
                      </Button>
                    )}
                    {e.status === 'UNDER_REVIEW' && (
                      <>
                        <Button disabled={busy} onClick={() => setDecision('correction')}>
                          Request correction
                        </Button>
                        <Button danger disabled={busy} onClick={() => setDecision('reject')}>
                          Reject claim
                        </Button>
                        {data.role === 'TREASURER' && (
                          <Button primary disabled={busy} onClick={() => setDecision('treasurer')}>
                            Treasurer approval
                          </Button>
                        )}
                      </>
                    )}
                    {e.status === 'TREASURER_APPROVED' &&
                      e.amount >= 250000 &&
                      data.role === 'ASSOCIATION_INCHARGE' && (
                        <Button primary disabled={busy} onClick={() => setDecision('president')}>
                          Association In-charge final approval
                        </Button>
                      )}
                    {(['INCHARGE_APPROVED', 'PRESIDENT_APPROVED'].includes(e.status) ||
                      (e.status === 'TREASURER_APPROVED' && e.amount < 250000)) &&
                      data.role === 'TREASURER' && (
                        <Button primary disabled={busy} onClick={() => setDecision('disburse')}>
                          Record disbursement
                        </Button>
                      )}
                  </div>
                )}
              </div>
            </Card>
            <Card title="Receipt proof">
              <div className="card-body stack">
                {e.receipt ? (
                  <>
                    <div className="receipt">
                      {e.receipt.startsWith('data:application/pdf') || e.receipt.endsWith('.pdf') ? (
                        <p>PDF receipt attached · open to inspect</p>
                      ) : (
                        <img
                          src={e.receipt}
                          alt={`Receipt for ${e.title}`}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                    <Button onClick={() => setPreview(true)}>
                      <ZoomIn size={16} />
                      Inspect receipt
                    </Button>
                  </>
                ) : (
                  <Notice tone="warning">No receipt attached to this draft.</Notice>
                )}
              </div>
            </Card>
          </div>
          <Card title="Claim timeline">
            <div className="card-body">
              <Timeline
                items={
                  e.history && e.history.length > 0
                    ? e.history
                    : [
                        { action: 'SUBMITTED', status: 'SUBMITTED', at: e.createdAt || e.purchaseDate },
                        ...(e.status !== 'SUBMITTED'
                          ? [{ action: e.status, status: e.status, at: e.updatedAt || e.createdAt }]
                          : []),
                      ]
                }
              />
            </div>
          </Card>
          <Notice>
            {e.status === 'TREASURER_APPROVED' && e.amount >= 250000
              ? 'Treasurer verification is recorded. No expense accrual or payable is posted until Association In-charge approval.'
              : ['INCHARGE_APPROVED', 'TREASURER_APPROVED'].includes(e.status)
                ? 'Final approval posted the expense and payable. Cash remains unchanged until disbursement.'
                : e.status === 'DISBURSED'
                  ? 'Disbursement cleared the payable and reduced operating cash.'
                  : 'The submitted claim has no financial effect until final approval.'}
          </Notice>
        </>
      ) : (
        <>
          <div className="toolbar">
            <input
              className="input"
              aria-label="Search expense claims"
              placeholder="Search merchant, title or reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Expense status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {[
                'ALL',
                'DRAFT',
                'SUBMITTED',
                'UNDER_REVIEW',
                'NEEDS_CORRECTION',
                'TREASURER_APPROVED',
                'INCHARGE_APPROVED',
                'REJECTED',
                'DISBURSED',
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <Table
            rows={data.expenses.filter(
              (e) =>
                `${e.title} ${e.merchant} ${e.id}`.toLowerCase().includes(search.toLowerCase()) &&
                (filter === 'ALL' || e.status === filter),
            )}
            columns={[
              {
                key: 'title',
                title: 'Claim',
                render: (e) => (
                  <Link
                    to={
                      management
                        ? `/dashboard/${data.club.slug}/expenses/${e.id}`
                        : `/portal/expenses/${e.id}`
                    }
                  >
                    <strong>{e.title}</strong>
                    <p className="caption muted mono">{e.id}</p>
                  </Link>
                ),
              },
              { key: 'merchant', title: 'Merchant' },
              {
                key: 'amount',
                title: 'Amount',
                align: 'number',
                render: (e) => <Currency amount={e.amount} />,
              },
              { key: 'purchaseDate', title: 'Purchased', render: (e) => date(e.purchaseDate) },
              { key: 'status', title: 'Status', render: (e) => <Badge value={e.status} /> },
            ]}
          />
        </>
      )}
      {preview && (
        <Modal title="Receipt inspection" onClose={() => setPreview(false)}>
          <div className="stack">
            <div className="row">
              <Button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>Zoom out</Button>
              <Button onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>Zoom in</Button>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div style={{ overflow: 'auto', maxHeight: '65vh' }}>
              {e.receipt.startsWith('data:application/pdf') || e.receipt.endsWith('.pdf') ? (
                <iframe className="receipt-preview" src={e.receipt} title="Expense receipt PDF" />
              ) : (
                <img
                  className="receipt-preview"
                  src={e.receipt}
                  alt="Original expense receipt"
                  loading="lazy"
                  decoding="async"
                  style={{ width: `${zoom * 100}%`, maxWidth: 'none', height: 'auto' }}
                />
              )}
            </div>
          </div>
        </Modal>
      )}
      {decision && (
        <Modal
          title={
            decision === 'disburse'
              ? 'Record simulated payout'
              : decision === 'reject'
                ? 'Reject claim'
                : decision === 'correction'
                  ? 'Request correction'
                  : 'Confirm independent approval'
          }
          onClose={() => setDecision(null)}
        >
          <Notice>
            Decision is recorded in the claim timeline and audit history.{' '}
            {decision === 'disburse'
              ? 'No real bank transfer is made.'
              : 'Self-approval is prohibited.'}
          </Notice>
          <RecordForm
            fields={[
              {
                name: 'reason',
                label: ['reject', 'correction'].includes(decision)
                  ? 'Required feedback'
                  : 'Decision note',
                required: ['reject', 'correction'].includes(decision),
                type: 'textarea',
                full: true,
              },
              ...(decision === 'president'
                ? [
                  {
                    name: 'override',
                    label: 'Budget override',
                    options: [
                      { value: 'false', label: 'Enforce allocated budget' },
                      { value: 'true', label: 'Association In-charge override · reason required' },
                    ],
                  },
                ]
                : []),
            ]}
            onCancel={() => setDecision(null)}
            submitLabel="Record decision"
            onSubmit={async (v) => {
              await expenseService.decision({
                expenseId: e.id,
                decision,
                reason: v.reason,
                override: v.override === 'true',
              });
              toast('Review decision recorded');
              setDecision(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
