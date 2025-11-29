'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookOpen, Calendar, Users, HelpCircle } from 'lucide-react';

interface WelcomeMessageProps {
  onQuestionClick: (question: string) => void;
}

/**
 * WelcomeMessage component
 * Displays welcome message and suggested questions for new chat sessions
 * Requirements 5.2, 9.3
 */
export function WelcomeMessage({ onQuestionClick }: WelcomeMessageProps) {
  // Suggested questions based on popular TUM topics
  const suggestedQuestions = [
    {
      icon: BookOpen,
      question: 'What courses are available in the Computer Science program?',
      category: 'Academics',
    },
    {
      icon: Calendar,
      question: 'When is the next semester starting?',
      category: 'Calendar',
    },
    {
      icon: Users,
      question: 'How can I join student organizations?',
      category: 'Campus Life',
    },
    {
      icon: HelpCircle,
      question: 'Where can I find information about housing?',
      category: 'Student Services',
    },
    {
      icon: MessageSquare,
      question: 'What resources are available for international students?',
      category: 'Support',
    },
  ];

  return (
    <section className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto" role="region" aria-labelledby="welcome-heading">
      <div className="max-w-md w-full space-y-4 md:space-y-6">
        {/* Welcome message - Requirement 9.3, 9.1 */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 mb-2 md:mb-4" aria-hidden="true">
            <MessageSquare className="h-7 w-7 md:h-8 md:w-8 text-primary" />
          </div>
          <h2 id="welcome-heading" className="text-lg md:text-2xl font-bold px-2">Welcome to TUM Wiki Assistant</h2>
          <p className="text-sm md:text-base text-muted-foreground px-2">
            Ask me anything about TUM! I can help you find information from the wiki,
            answer questions, and recommend relevant articles.
          </p>
        </header>

        {/* Suggested questions - Requirements 5.2, 9.1, 9.3 */}
        <nav aria-labelledby="suggested-questions-heading">
          <h3 id="suggested-questions-heading" className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3 px-2">
            Try asking about:
          </h3>
          <ul className="space-y-2 md:space-y-2" role="list">
            {suggestedQuestions.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={index}>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-3 md:py-3 md:px-4 focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation active:scale-98 transition-transform"
                    onClick={() => onQuestionClick(item.question)}
                    aria-label={`Ask about ${item.category}: ${item.question}`}
                  >
                    <Icon className="h-4 w-4 md:h-4 md:w-4 mr-2.5 md:mr-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm md:text-sm font-medium line-clamp-2 block">
                        {item.question}
                      </span>
                      <span className="text-xs md:text-xs text-muted-foreground block mt-0.5">
                        {item.category}
                      </span>
                    </div>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="text-xs md:text-xs text-center text-muted-foreground px-2" role="note" aria-label="Helpful tip">
          <span aria-hidden="true">💡</span> Tip: I can cite sources and recommend articles for deeper reading
        </p>
      </div>
    </section>
  );
}
