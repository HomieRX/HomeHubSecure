import json
import re
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).parent
interface_path = ROOT / 'server' / 'storage.ts'
interface_text = interface_path.read_text(encoding='utf-8')
match = re.search(r'export interface IStorage \{(.*)\n\}', interface_text, re.S)
if not match:
    raise SystemExit('IStorage interface not found')
body = match.group(1)

sections: OrderedDict[str, list[str]] = OrderedDict()
current = 'General'
for raw in body.split('\n'):
    line = raw.strip()
    if not line:
        continue
    if line.startswith('//'):
        current = re.sub(r'^//\s*', '', line)
        sections.setdefault(current, [])
        continue
    m = re.match(r'([a-zA-Z0-9_]+)\(', line)
    if m:
        sections.setdefault(current, []).append(m.group(1))


def extract_methods(text: str, class_name: str) -> set[str]:
    pattern = rf'class\s+{class_name}.*?\{{(.*)\n\}}'
    m = re.search(pattern, text, re.S)
    if not m:
        return set()
    block = m.group(1)
    result: set[str] = set()
    for line in block.split('\n'):
        stripped = line.strip()
        if not stripped or stripped.startswith('//'):
            continue
        if stripped.startswith('async '):
            name = stripped.split('(')[0].split()[-1]
            result.add(name)
        elif re.match(r'[a-zA-Z0-9_]+\(.*\)\s*\{', stripped) and 'constructor' not in stripped and 'async' not in stripped:
            name = stripped.split('(')[0]
            result.add(name)
    return result

mem_methods = extract_methods(interface_text, 'MemStorage')
db_text = (ROOT / 'server' / 'storage.db.ts').read_text(encoding='utf-8')
db_methods = extract_methods(db_text, 'DbStorage')

REPORT_LINES = []
REPORT_LINES.append('SECTION_SUMMARY')
for sec, names in sections.items():
    filtered = [n for n in names if n != 'constructor']
    missing_mem = [n for n in filtered if n not in mem_methods]
    missing_db = [n for n in filtered if n not in db_methods]
    REPORT_LINES.append(f'[{sec}] total={len(filtered)} missing_mem={len(missing_mem)} missing_db={len(missing_db)}')
    if missing_mem:
        REPORT_LINES.append('  missing_mem_list=' + ', '.join(missing_mem))
    if missing_db:
        REPORT_LINES.append('  missing_db_list=' + ', '.join(missing_db))

REPORT_LINES.append('\nDETAILED_METHODS')
for sec, names in sections.items():
    filtered = [n for n in names if n != 'constructor']
    if not filtered:
        continue
    REPORT_LINES.append(f'## {sec}')
    for name in filtered:
        REPORT_LINES.append(f'- {name}: inMem={'Y' if name in mem_methods else 'N'}, inDb={'Y' if name in db_methods else 'N'}')

(ROOT / 'storage_phase1_report.txt').write_text('\n'.join(REPORT_LINES), encoding='utf-8')

SECTION_CONFIG = OrderedDict([
    ('User management (IMPORTANT: Required methods for Replit Auth)', ('UserRepository', 'users')),
    ('Member profiles', ('MemberProfileRepository', 'members')),
    ('Sanitized public access methods (PII-safe)', ('PublicDirectoryRepository', 'publicDirectory')),
    ('Contractor profiles', ('ContractorRepository', 'contractors')),
    ('Merchant profiles', ('MerchantRepository', 'merchants')),
    ('Home details', ('HomeDetailsRepository', 'homes')),
    ('Service requests', ('ServiceRequestRepository', 'serviceRequests')),
    ('Work orders', ('WorkOrderRepository', 'workOrders')),
    ('Estimates', ('EstimateRepository', 'estimates')),
    ('Invoices', ('InvoiceRepository', 'invoices')),
    ('Loyalty points', ('LoyaltyRepository', 'loyalty')),
    ('Deals', ('DealRepository', 'deals')),
    ('Messages', ('MessageRepository', 'messages')),
    ('Notifications', ('NotificationRepository', 'notifications')),
    ('Notification Settings', ('NotificationSettingsRepository', 'notificationSettings')),
    ('Calendar events', ('CalendarRepository', 'calendar')),
    ('Community', ('CommunityRepository', 'community')),
    ('Forums', ('ForumRepository', 'forums')),
    ('Forum Topics', ('ForumTopicRepository', 'forumTopics')),
    ('Forum Posts', ('ForumPostRepository', 'forumPosts')),
    ('Forum Post Voting', ('ForumVoteRepository', 'forumVotes')),
    ('Forum Statistics and Analytics', ('ForumAnalyticsRepository', 'forumAnalytics')),
    ('Forum Moderation', ('ForumModerationRepository', 'forumModeration')),
    ('Gamification - Badges', ('BadgeRepository', 'badges')),
    ('Gamification - Ranks', ('RankRepository', 'ranks')),
    ('Gamification - Achievements', ('AchievementRepository', 'achievements')),
    ('Maintenance Items', ('MaintenanceRepository', 'maintenance')),
    ('Time slot management', ('SchedulingSlotRepository', 'schedulingSlots')),
    ('Work order scheduling queries', ('SchedulingWorkOrderRepository', 'schedulingWorkOrders')),
    ('Schedule conflict management', ('SchedulingConflictRepository', 'schedulingConflicts')),
    ('Schedule audit logging', ('SchedulingAuditRepository', 'schedulingAudit')),
    ('Data seeding and initialization', ('SeedRepository', 'seed')),
])

contracts_lines = ["import type { IStorage } from '../storage';", '']
repository_entries = []

for sec, (type_name, prop_name) in SECTION_CONFIG.items():
    methods = [n for n in sections.get(sec, []) if n != 'constructor']
    if not methods:
        continue
    keys = ' |\n  '.join(f"'{name}'" for name in methods)
    contracts_lines.append(f'export type {type_name} = Pick<IStorage,\n  {keys}\n>;\n')
    repository_entries.append((prop_name, type_name))

contracts_lines.append('export interface StorageRepositories {')
for prop_name, type_name in repository_entries:
    contracts_lines.append(f'  {prop_name}: {type_name};')
contracts_lines.append('}\n')

contracts_lines.append('export const createStorageRepositories = (storage: IStorage): StorageRepositories => ({')
for prop_name, type_name in repository_entries:
    contracts_lines.append(f'  {prop_name}: storage as {type_name},')
contracts_lines.append('});\n')

(ROOT / 'server' / 'storage' / 'contracts.ts').write_text('\n'.join(contracts_lines), encoding='utf-8')
