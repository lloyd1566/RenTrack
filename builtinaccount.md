# Built-in Accounts

Default accounts are created automatically on first run. Credentials are generated dynamically and logged to the server console. Do not commit actual passwords to version control.

## Setup

Set these environment variables before deployment to define built-in account credentials:

- `ADMIN_EMAIL` - Admin account email (default: admin@renttrack.com)
- `ADMIN_PASSWORD` - Admin account password (auto-generated if not set)
- `OWNER_EMAIL` - Owner account email (default: renttrackowner@gmail.com)
- `OWNER_PASSWORD` - Owner account password (auto-generated if not set)

## Roles

- **Admin** - Full system access
- **Owner** - Property management access
- **Agent** - Tenant and property management
- **Tenant** - Rent payment and profile management

## Security Notes

- Change default credentials immediately after first login
- Use strong, unique passwords for each account
- Enable 2FA where available
- Rotate credentials regularly
- Never expose credentials in client-side code or public repositories