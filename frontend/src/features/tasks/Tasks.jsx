import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { useAction } from '../../hooks/useAction.js';
import { taskService } from '../../services/serviceFactory.js';
import { taskStatuses, managerRoles } from '../../services/permissions.js';
import {
  PageHeader,
  Button,
  Badge,
  Avatar,
  Card,
  Progress,
  Modal,
  Empty,
  Table,
} from '../../components/common/UI.jsx';
import RecordForm from '../../components/forms/RecordForm.jsx';
import { label } from '../../utils/format.js';
export default function Tasks() {
  const { data, toast } = useApp(),
    { id } = useParams(),
    { run, busy } = useAction();
  const [query, setQuery] = useState(''),
    [fundraiser, setFundraiser] = useState('ALL'),
    [view, setView] = useState('board'),
    [edit, setEdit] = useState(null),
    [detail, setDetail] = useState(id || null),
    [drag, setDrag] = useState(null),
    [over, setOver] = useState(null);
  const manager = managerRoles.includes(data.role);
  const tasks = data.tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) &&
      (fundraiser === 'ALL' || t.fundraiserId === fundraiser),
  );
  const due = (t) => {
    const hours = Math.ceil((new Date(t.due) - data.clock) / 3600000);
    return hours < 0
      ? `${Math.abs(hours)}h overdue`
      : hours < 24
        ? `${hours}h left`
        : `${Math.ceil(hours / 24)}d left`;
  };
  const can = (t) => manager || (data.role === 'VOLUNTEER' && t.assignee === data.user.id);
  const move = (taskId, status) => run(() => taskService.update({ taskId, status }), 'Task moved');
  const card = (t) => (
    <article
      key={t.id}
      className={`card task-card ${drag === t.id ? 'dragging' : ''}`}
      draggable={can(t) && !busy}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', t.id);
        setDrag(t.id);
      }}
      onDragEnd={() => {
        setDrag(null);
        setOver(null);
      }}
    >
      <div className="row between">
        <Badge value={t.priority} />
        <Button icon aria-label={`Open task ${t.title}`} onClick={() => setDetail(t.id)}>
          ↗
        </Button>
      </div>
      <h3>{t.title}</h3>
      <span className="caption muted">
        {(t.checklist || []).filter((c) => c.done).length} of {(t.checklist || []).length} done
      </span>
      <Progress
        value={
          t.checklist?.length
            ? ((t.checklist || []).filter((c) => c.done).length / t.checklist.length) * 100
            : 0
        }
      />
      <div className="task-footer">
        <Avatar name={data.users.find((u) => u.id === t.assignee)?.name || 'Unassigned'} />
        <Badge
          tone={new Date(t.due) - data.clock < 86400000 && t.status !== 'DONE' ? 'danger' : ''}
        >
          {due(t)}
        </Badge>
      </div>
      <label className="sr-only" htmlFor={`task-state-${t.id}`}>
        Move {t.title} to status
      </label>
      <select
        id={`task-state-${t.id}`}
        aria-label={`Status for ${t.title}`}
        disabled={!can(t) || busy}
        value={t.status}
        onChange={(e) => move(t.id, e.target.value)}
      >
        {taskStatuses.map((s) => (
          <option value={s} key={s}>
            {label(s)}
          </option>
        ))}
      </select>
    </article>
  );
  const selected = data.tasks.find((t) => t.id === detail);
  return (
    <div className="stack">
      <PageHeader
        title={manager ? 'A little structure. A lot of progress.' : 'My tasks'}
        description="Shared ownership, clear next steps. Keep the good work moving."
      >
        {manager && (
          <Button primary onClick={() => setEdit({ status: 'BACKLOG', priority: 'MEDIUM' })}>
            Create task
          </Button>
        )}
      </PageHeader>
      <div className="toolbar">
        <input
          className="input"
          aria-label="Search tasks"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="row">
          <select
            aria-label="Filter tasks by fundraiser"
            value={fundraiser}
            onChange={(e) => setFundraiser(e.target.value)}
          >
            <option value="ALL">All campaigns</option>
            {data.fundraisers.map((f) => (
              <option value={f.id} key={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          <Button onClick={() => setView(view === 'board' ? 'list' : 'board')}>
            {view === 'board' ? 'List view' : 'Board view'}
          </Button>
        </div>
      </div>
      {view === 'board' ? (
        <div
          className="kanban-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable task board"
        >
          <div className="kanban">
            {taskStatuses.map((status) => (
              <section
                className={`kanban-column ${over === status ? 'drag-over' : ''}`}
                key={status}
                aria-label={`${status} column`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(status);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) move(taskId, status);
                  setOver(null);
                  setDrag(null);
                }}
              >
                <div className="kanban-column-head">
                  <span>{status}</span>
                  <Badge>{tasks.filter((t) => t.status === status).length}</Badge>
                </div>
                {tasks.filter((t) => t.status === status).map(card)}
                {!tasks.some((t) => t.status === status) && (
                  <p className="caption muted">
                    {manager ? 'Drop a task here' : 'No assigned tasks here'}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      ) : (
        <Table
          rows={tasks}
          columns={[
            {
              key: 'title',
              title: 'Task',
              render: (t) => <Button onClick={() => setDetail(t.id)}>{t.title}</Button>,
            },
            { key: 'priority', title: 'Priority', render: (t) => <Badge value={t.priority} /> },
            { key: 'status', title: 'Status', render: (t) => <Badge value={t.status} /> },
            { key: 'due', title: 'Due', render: (t) => due(t) },
          ]}
        />
      )}
      <p className="caption muted">
        Drag tasks between columns, or use the status selector with a keyboard or touch device.
      </p>
      {selected && (
        <Modal title={selected.title} onClose={() => setDetail(null)}>
          <div className="stack">
            <Badge value={selected.status} />
            <p>{selected.description}</p>
            {(selected.checklist || []).map((item, i) => (
              <label className="checkbox-label" key={i}>
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={!can(selected) || busy}
                  onChange={(e) =>
                    run(
                      () =>
                        taskService.update({
                          taskId: selected.id,
                          checklist: (selected.checklist || []).map((c, n) =>
                            n === i ? { ...c, done: e.target.checked } : c,
                          ),
                        }),
                      'Checklist updated',
                    )
                  }
                />
                {item.title}
              </label>
            ))}
            {manager && (
              <Button
                onClick={() => {
                  setEdit(selected);
                  setDetail(null);
                }}
              >
                Edit task
              </Button>
            )}
          </div>
        </Modal>
      )}
      {edit && (
        <Modal title={edit.id ? 'Edit task' : 'Create task'} onClose={() => setEdit(null)}>
          <RecordForm
            fields={[
              { name: 'title', label: 'Task title', required: true },
              {
                name: 'priority',
                label: 'Priority',
                required: true,
                options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              },
              { name: 'status', label: 'Status', required: true, options: taskStatuses },
              {
                name: 'assignee',
                label: 'Assignee',
                options: data.users
                  .filter((u) => data.memberships.some((m) => m.userId === u.id))
                  .map((u) => ({ value: u.id, label: u.name })),
              },
              { name: 'due', label: 'Due date', type: 'datetime-local', required: true },
              {
                name: 'fundraiserId',
                label: 'Fundraiser',
                options: data.fundraisers.map((f) => ({ value: f.id, label: f.title })),
              },
              { name: 'description', label: 'Description', type: 'textarea', full: true },
              {
                name: 'checklistText',
                label: 'Checklist · one item per line',
                type: 'textarea',
                full: true,
              },
            ]}
            initial={{
              ...edit,
              due: edit.due ? edit.due.slice(0, 16) : '',
              checklistText: edit.checklist?.map((c) => c.title).join('\n'),
            }}
            onCancel={() => setEdit(null)}
            onSubmit={async (v) => {
              await taskService.save({
                ...v,
                id: edit.id,
                due: new Date(v.due).toISOString(),
                checklist: (v.checklistText || '')
                  .split('\n')
                  .filter(Boolean)
                  .map((title, i) => ({ title, done: edit.checklist?.[i]?.done || false })),
              });
              toast('Task saved');
              setEdit(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
