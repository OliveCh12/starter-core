'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, BookOpen, MessageCircle, Mail, ExternalLink } from 'lucide-react';

const helpSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using the dashboard',
    icon: BookOpen,
    articles: [
      'Setting up your profile',
      'Creating your first post',
      'Managing team members',
      'Understanding the dashboard'
    ]
  },
  {
    id: 'settings',
    title: 'Settings & Configuration',
    description: 'Customize your experience',
    icon: HelpCircle,
    articles: [
      'General settings',
      'Security & privacy',
      'Notification preferences',
      'Appearance customization'
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: MessageCircle,
    articles: [
      'Login problems',
      'Performance issues',
      'Feature not working',
      'Data synchronization'
    ]
  }
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers to common questions and learn how to make the most of your dashboard.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Docs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Sections */}
      <div className="grid gap-6 md:grid-cols-1">
        {helpSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {section.articles.map((article, index) => (
                  <Button 
                    key={index}
                    variant="ghost" 
                    className="justify-start h-auto p-3"
                    size="sm"
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{article}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            System Status
            <Badge variant="secondary" className="text-green-700 bg-green-50">
              All Systems Operational
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All services are running normally. Last updated: {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}