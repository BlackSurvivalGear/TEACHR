import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, updateDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const labels = { member: 'Member', pro: 'Pro TEACHR', admin: 'Admin', superadmin: 'Superadmin' };
const toolLabels = { lesson:'Lesson Builder', worksheet:'Worksheet', quiz:'Assessment', differentiate:'Differentiation', curriculum:'Curriculum Planner', revision:'Revision Pack', parent:'Parent Message' };
const toolIds = Object.keys(toolLabels), FREE_ALLOWANCE = 3;
let currentRole = 'member', currentUid = '', usersByUid = new Map();
const table = document.getElementById('userTable'), status = document.getElementById('adminStatus');
const usagePanel = document.getElementById('usagePanel'), usageTable = document.getElementById('usageTable');
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const date = value => value?.toDate ? value.toDate().toLocaleDateString('en-GB') : '—';
function setStatus(message, type = '') { status.textContent = message; status.dataset.type = type; }
function normalise(item) { const data = item.data(); return { uid: item.id, ...data, role: labels[data.role] ? data.role : 'member', plan: data.plan === 'pro' ? 'pro' : 'free', suspended: data.suspended === true }; }
function actions(user) {
  const protectedUser = user.email?.toLowerCase() === 'admin@lawal.org' || user.uid === currentUid;
  if (protectedUser) return '<span class="user-email">Protected</span>';
  const roles = currentRole === 'superadmin' ? ['member','pro','admin'] : ['member','pro'];
  const options = roles.map(role => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${labels[role]}</option>`).join('');
  return `<div class="actions"><select data-role="${esc(user.uid)}">${options}</select><button data-toggle="${esc(user.uid)}" data-suspended="${user.suspended}">${user.suspended ? 'Restore' : 'Suspend'}</button><button class="danger" data-delete="${esc(user.uid)}">Remove</button></div>`;
}
function render(users) {
  usersByUid = new Map(users.map(user => [user.uid, user]));
  document.getElementById('statTotal').textContent = users.length;
  document.getElementById('statMembers').textContent = users.filter(u => u.role === 'member').length;
  document.getElementById('statPros').textContent = users.filter(u => u.role === 'pro' || u.plan === 'pro').length;
  document.getElementById('statAdmins').textContent = users.filter(u => ['admin','superadmin'].includes(u.role)).length;
  document.getElementById('statSuspended').textContent = users.filter(u => u.suspended).length;
  table.innerHTML = users.length ? users.map(user => `<tr><td><span class="user-name">${esc(user.displayName || 'TEACHR Member')}</span><span class="user-email">${esc(user.email || 'No email')}</span></td><td><span class="pill ${user.role}">${labels[user.role]}</span></td><td><span class="pill ${user.plan}">${user.plan === 'pro' ? 'Pro' : 'Free'}</span></td><td><span class="pill ${user.suspended ? 'suspended' : 'active'}">${user.suspended ? 'Suspended' : 'Active'}</span></td><td>${date(user.createdAt)}</td><td><button class="usage-button" data-usage="${esc(user.uid)}" type="button">View usage</button></td><td>${actions(user)}</td></tr>`).join('') : '<tr><td colspan="7">No user profiles found.</td></tr>';
}
async function loadUsers() { setStatus('Loading users…'); try { const snap = await getDocs(collection(db, 'users')); const users = snap.docs.map(normalise).sort((a,b)=>(a.email||'').localeCompare(b.email||'')); render(users); setStatus(`${users.length} account${users.length === 1 ? '' : 's'} loaded.`); } catch (error) { console.error(error); setStatus('Unable to load user profiles. Check the deployed Firestore rules.', 'error'); } }
async function showUsage(uid) {
  const user = usersByUid.get(uid); if (!user) return;
  setStatus('Loading generation usage…');
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'usage'));
    const records = new Map(snap.docs.map(item => [item.id, item.data() || {}]));
    const unlimited = ['pro','admin','superadmin'].includes(user.role) || user.plan === 'pro';
    let totalUsed = 0, totalRemaining = 0;
    usageTable.innerHTML = toolIds.map(toolId => {
      const raw = records.get(toolId) || {};
      const used = Number.isInteger(Number(raw.successfulGenerations)) && Number(raw.successfulGenerations) > 0 ? Number(raw.successfulGenerations) : 0;
      const allowance = Number.isInteger(Number(raw.allowance)) && Number(raw.allowance) >= 0 ? Number(raw.allowance) : FREE_ALLOWANCE;
      const remaining = Math.max(0, allowance - used); totalUsed += used; totalRemaining += remaining;
      const percent = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 100;
      return `<tr><td><strong>${toolLabels[toolId]}</strong></td><td>${used}</td><td>${unlimited ? 'Unlimited' : allowance}</td><td><strong>${unlimited ? 'Unlimited' : remaining}</strong></td><td><div class="usage-meter"><span style="width:${unlimited ? 0 : percent}%"></span></div></td></tr>`;
    }).join('');
    document.getElementById('usageMemberName').textContent = user.displayName || 'TEACHR Member';
    document.getElementById('usageMemberEmail').textContent = user.email || 'No email';
    document.getElementById('usageSummary').innerHTML = `<article><span>Successful generations</span><strong>${totalUsed}</strong></article><article><span>Plan</span><strong>${unlimited ? 'Unlimited' : 'Free'}</strong></article><article><span>Available now</span><strong>${unlimited ? '∞' : totalRemaining}</strong></article>`;
    usagePanel.hidden = false; usagePanel.scrollIntoView({ behavior:'smooth', block:'start' }); setStatus('Generation usage loaded.');
  } catch (error) { console.error(error); setStatus('Unable to load generation usage.', 'error'); }
}
document.getElementById('refreshUsers').addEventListener('click', loadUsers);
document.getElementById('closeUsage').addEventListener('click', () => { usagePanel.hidden = true; });
table.addEventListener('change', async event => { const select = event.target.closest('[data-role]'); if (!select) return; select.disabled = true; const role = select.value; try { await updateDoc(doc(db,'users',select.dataset.role), { role, plan: role === 'pro' ? 'pro' : 'free', updatedAt: new Date() }); await loadUsers(); } catch (error) { console.error(error); setStatus('Unable to change this role.', 'error'); select.disabled = false; } });
table.addEventListener('click', async event => { const usage = event.target.closest('[data-usage]'), toggle = event.target.closest('[data-toggle]'), remove = event.target.closest('[data-delete]'); if (usage) return showUsage(usage.dataset.usage); if (toggle) { toggle.disabled = true; const suspended = toggle.dataset.suspended === 'true'; try { await updateDoc(doc(db,'users',toggle.dataset.toggle), { suspended: !suspended, accountStatus: suspended ? 'active' : 'suspended', updatedAt: new Date() }); await loadUsers(); } catch (error) { console.error(error); setStatus('Unable to change account status.', 'error'); toggle.disabled = false; } } if (remove) { if (!confirm('Remove this TEACHR profile? The Firebase sign-in account will remain.')) return; remove.disabled = true; try { await deleteDoc(doc(db,'users',remove.dataset.delete)); await loadUsers(); } catch (error) { console.error(error); setStatus('Unable to remove this profile.', 'error'); remove.disabled = false; } } });
onAuthStateChanged(auth, async user => { if (!user) { location.replace('index.html'); return; } currentUid = user.uid; try { const own = (await getDoc(doc(db,'users',user.uid))).data() || {}; currentRole = user.email?.toLowerCase() === 'admin@lawal.org' ? 'superadmin' : own.role; if (!['admin','superadmin'].includes(currentRole)) { location.replace('index.html'); return; } document.getElementById('adminRole').textContent = labels[currentRole]; await loadUsers(); } catch (error) { console.error(error); setStatus('Administrator access could not be verified.', 'error'); } });
