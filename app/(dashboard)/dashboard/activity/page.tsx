import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  FileText,
  MessageCircle,
  Heart,
  Eye,
  UserCheck,
  Shield,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  // Authentication
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.EMAIL_VERIFIED]: CheckCircle,
  
  // Account management
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_PROFILE]: Settings,
  [ActivityType.UPDATE_PREFERENCES]: Settings,
  
  // Posts
  [ActivityType.CREATE_POST]: FileText,
  [ActivityType.UPDATE_POST]: FileText,
  [ActivityType.DELETE_POST]: UserMinus,
  [ActivityType.VIEW_POST]: Eye,
  
  // Comments
  [ActivityType.CREATE_COMMENT]: MessageCircle,
  [ActivityType.UPDATE_COMMENT]: MessageCircle,
  [ActivityType.DELETE_COMMENT]: UserMinus,
  
  // Reactions
  [ActivityType.REACT_TO_POST]: Heart,
  [ActivityType.REACT_TO_COMMENT]: Heart,
  [ActivityType.REMOVE_REACTION]: UserMinus,
  
  // Social interactions
  [ActivityType.FOLLOW_USER]: UserCheck,
  [ActivityType.UNFOLLOW_USER]: UserMinus,
  [ActivityType.BLOCK_USER]: Shield,
  [ActivityType.UNBLOCK_USER]: UserCheck,
  [ActivityType.VIEW_PROFILE]: Eye,
  
  // Teams
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.UPDATE_TEAM]: Settings,
  [ActivityType.DELETE_TEAM]: UserMinus,
  [ActivityType.JOIN_TEAM]: CheckCircle,
  [ActivityType.LEAVE_TEAM]: LogOut,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.DECLINE_INVITATION]: UserMinus,
  
  // Subscriptions
  [ActivityType.SUBSCRIBE]: CreditCard,
  [ActivityType.UNSUBSCRIBE]: UserMinus,
  [ActivityType.UPGRADE_SUBSCRIPTION]: CreditCard,
  [ActivityType.DOWNGRADE_SUBSCRIPTION]: CreditCard,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    // Authentication
    case ActivityType.SIGN_UP: return 'You signed up';
    case ActivityType.SIGN_IN: return 'You signed in';
    case ActivityType.SIGN_OUT: return 'You signed out';
    case ActivityType.EMAIL_VERIFIED: return 'You verified your email';
    
    // Account management
    case ActivityType.UPDATE_PASSWORD: return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT: return 'You deleted your account';
    case ActivityType.UPDATE_PROFILE: return 'You updated your profile';
    case ActivityType.UPDATE_PREFERENCES: return 'You updated your preferences';
    
    // Posts
    case ActivityType.CREATE_POST: return 'You created a post';
    case ActivityType.UPDATE_POST: return 'You updated a post';
    case ActivityType.DELETE_POST: return 'You deleted a post';
    case ActivityType.VIEW_POST: return 'You viewed a post';
    
    // Comments
    case ActivityType.CREATE_COMMENT: return 'You commented on a post';
    case ActivityType.UPDATE_COMMENT: return 'You updated a comment';
    case ActivityType.DELETE_COMMENT: return 'You deleted a comment';
    
    // Reactions
    case ActivityType.REACT_TO_POST: return 'You reacted to a post';
    case ActivityType.REACT_TO_COMMENT: return 'You reacted to a comment';
    case ActivityType.REMOVE_REACTION: return 'You removed a reaction';
    
    // Social interactions
    case ActivityType.FOLLOW_USER: return 'You followed a user';
    case ActivityType.UNFOLLOW_USER: return 'You unfollowed a user';
    case ActivityType.BLOCK_USER: return 'You blocked a user';
    case ActivityType.UNBLOCK_USER: return 'You unblocked a user';
    case ActivityType.VIEW_PROFILE: return 'You viewed a profile';
    
    // Teams
    case ActivityType.CREATE_TEAM: return 'You created a team';
    case ActivityType.UPDATE_TEAM: return 'You updated team settings';
    case ActivityType.DELETE_TEAM: return 'You deleted a team';
    case ActivityType.JOIN_TEAM: return 'You joined a team';
    case ActivityType.LEAVE_TEAM: return 'You left a team';
    case ActivityType.REMOVE_TEAM_MEMBER: return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER: return 'You invited a team member';
    case ActivityType.ACCEPT_INVITATION: return 'You accepted an invitation';
    case ActivityType.DECLINE_INVITATION: return 'You declined an invitation';
    
    // Subscriptions
    case ActivityType.SUBSCRIBE: return 'You subscribed to a plan';
    case ActivityType.UNSUBSCRIBE: return 'You cancelled your subscription';
    case ActivityType.UPGRADE_SUBSCRIPTION: return 'You upgraded your subscription';
    case ActivityType.DOWNGRADE_SUBSCRIPTION: return 'You downgraded your subscription';
    
    default:
      return 'Unknown action occurred';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Activity Log
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType
                );

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you perform actions like signing in or updating your
                account, they'll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
