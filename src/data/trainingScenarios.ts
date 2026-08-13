// Training Scenarios - Crewcore HR Management System

export interface ScenarioNode {
  id: string;
  botMessage: string;
  options: {
    text: string;
    nextNodeId: string;
    scoreFeedback: string;
    points: number;
  }[];
}

export interface TrainingScenario {
  id: string;
  title: string;
  domain: string;
  role: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  intro: string;
  firstNodeId: string;
  nodes: { [key: string]: ScenarioNode };
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: 'scen-conflict-resolution',
    title: 'Mediate: Conflict Between Lead Developer and Project Manager',
    domain: 'employee-relations',
    role: 'HR Relations Manager',
    difficulty: 'Intermediate',
    intro: 'You are an HR Generalist. David, the Project Manager, and Lisa, the Lead Software Engineer, have been arguing. David says Lisa misses standup meetings and delays sprints. Lisa says David micromanages her and schedules meetings that break her coding flow. Meet with Lisa first to hear her side.',
    firstNodeId: 'node-lisa-start',
    nodes: {
      'node-lisa-start': {
        id: 'node-lisa-start',
        botMessage: 'Thanks for meeting, HR. David is driving me crazy! He schedules three check-ins a day. I can\'t write single lines of code without him asking for updates. I missed standups because I was deploying code at 3 AM! What do you expect me to do?',
        options: [
          {
            text: 'Tell her David is just doing his job and sprint deadlines must be respected.',
            nextNodeId: 'node-lisa-defensive',
            scoreFeedback: 'Too authoritarian. You shut down the employee\'s perspective without addressing the systemic issue (unreasonable check-in frequencies).',
            points: 5
          },
          {
            text: 'Acknowledge her frustration about the interruption and ask what check-in frequency would work for her.',
            nextNodeId: 'node-lisa-cooperative',
            scoreFeedback: 'Excellent! Active listening and focus on finding a constructive, compromise-oriented solution.',
            points: 20
          },
          {
            text: 'Agree with her that David is micromanaging and promise to tell him to back off.',
            nextNodeId: 'node-lisa-unprofessional',
            scoreFeedback: 'Taking sides immediately is unprofessional for HR and destroys your neutrality as a mediator.',
            points: 10
          }
        ]
      },
      'node-lisa-defensive': {
        id: 'node-lisa-defensive',
        botMessage: 'If all you care about is deadlines, maybe you should write the code yourself! I work late to keep this app running, and all I get is harassment from David and now you. I think I\'m going to start looking for another job.',
        options: [
          {
            text: 'Apologize, step back, validate her late-night efforts, and ask for a collaborative solution.',
            nextNodeId: 'node-lisa-cooperative',
            scoreFeedback: 'Good course correction. De-escalating and acknowledging efforts helps rebuild trust.',
            points: 15
          },
          {
            text: 'Explain that threat of leaving doesn\'t solve the immediate issue. Remind her of company attendance policy.',
            nextNodeId: 'node-lisa-quit',
            scoreFeedback: 'Too rigid. You have escalated the situation, and Lisa is likely to disengage or resign.',
            points: 5
          }
        ]
      },
      'node-lisa-cooperative': {
        id: 'node-lisa-cooperative',
        botMessage: 'I think one morning standup is fine, and we can use Slack updates in the afternoon instead of meetings. If I could get blocks of uninterrupted coding time, I\'d hit every sprint goal easily. Will David agree to that?',
        options: [
          {
            text: 'Offer to run this proposal by David and set up a joint meeting to codify this agreement.',
            nextNodeId: 'node-lisa-success',
            scoreFeedback: 'Perfect step. Proposing a pilot check-in structure and scheduling a mediation session is the ideal HR resolution.',
            points: 25
          },
          {
            text: 'Tell her you\'ll write it in a memo and force David to follow it.',
            nextNodeId: 'node-lisa-unprofessional',
            scoreFeedback: 'Using force creates resentment. The project manager should participate in the agreement.',
            points: 10
          }
        ]
      },
      'node-lisa-unprofessional': {
        id: 'node-lisa-unprofessional',
        botMessage: 'Thanks, I glad someone has my back. But to be honest, David won\'t listen to a soft request. He wants control. Are you actually going to write him up or order him to stop?',
        options: [
          {
            text: 'Clarify that HR remains neutral and that you will work with David to create a structured system, not penalize him.',
            nextNodeId: 'node-lisa-cooperative',
            scoreFeedback: 'Excellent reset. You successfully re-established your neutrality and steered towards structure.',
            points: 20
          },
          {
            text: 'Yes, tell her you will launch a formal review on David\'s management style.',
            nextNodeId: 'node-lisa-failure',
            scoreFeedback: 'Very poor. Creating formal conflicts on hearsay escalates hostility and breaches mediation ethics.',
            points: 5
          }
        ]
      },
      'node-lisa-quit': {
        id: 'node-lisa-quit',
        botMessage: 'I\'m done. I will email my resignation today. This place doesn\'t value engineers.',
        options: []
      },
      'node-lisa-success': {
        id: 'node-lisa-success',
        botMessage: 'Thanks, HR. I appreciate you taking the time to listen and proposing a realistic way out. I feel a lot better.',
        options: []
      },
      'node-lisa-failure': {
        id: 'node-lisa-failure',
        botMessage: 'This sounds like it\'s turning into an legal headache. I\'m just going to talk to a lawyer or quit. Goodbye.',
        options: []
      }
    }
  },
  {
    id: 'scen-salary-exception',
    title: 'Negotiate: Out-of-Band Salary Exception',
    domain: 'hr-operations',
    role: 'Compensation Analyst',
    difficulty: 'Advanced',
    intro: 'You are an HR Compensation Analyst. The Director of Engineering, Marcus, wants to hire a Senior DevOps Engineer. The candidate is asking for $185k base salary. The absolute ceiling for this role band is $165k. Marcus says this is a critical hire and they cannot find anyone else. Manage the discussion.',
    firstNodeId: 'node-marcus-start',
    nodes: {
      'node-marcus-start': {
        id: 'node-marcus-start',
        botMessage: 'HR, we HAVE to make this hire. The production database went down twice last month. We don\'t have a dedicated DevOps engineer and this candidate has 10 years of experience. I know the cap is $165k, but we need to pay $185k. Can you approve the exception?',
        options: [
          {
            text: 'Reject immediately. Explain that salary bands are fixed and breaking them creates pay inequity issues.',
            nextNodeId: 'node-marcus-angry',
            scoreFeedback: 'While legally sound, flat rejections without creative problem-solving frustrate hiring managers and ignore critical business pain.',
            points: 8
          },
          {
            text: 'Ask if we can structure a package with a signing bonus or performance bonuses to match their target without raising the base salary.',
            nextNodeId: 'node-marcus-bonus-solution',
            scoreFeedback: 'Outstanding! Using sign-on bonuses or equity allows you to meet the target total compensation while keeping base salaries within standard bands.',
            points: 25
          },
          {
            text: 'Approve the base exception immediately. The databases must be stable, whatever the cost.',
            nextNodeId: 'node-marcus-inequity',
            scoreFeedback: 'Approving exception without justification creates severe internal equity risks. Existing senior engineers will find out and demand adjustments.',
            points: 5
          }
        ]
      },
      'node-marcus-angry': {
        id: 'node-marcus-angry',
        botMessage: 'Easy for you to say! When the databases crash, the clients call me, not HR. If we lose clients, we can\'t pay anyone at all. There must be some flexibility. What options do I have?',
        options: [
          {
            text: 'Propose keeping base salary at $165k and offering a $20k sign-on bonus plus performance-based equity.',
            nextNodeId: 'node-marcus-bonus-solution',
            scoreFeedback: 'Good fallback. Transitioning to a hybrid compensation model satisfies equity policies and recruitment targets.',
            points: 20
          },
          {
            text: 'Explain that Marcus can appeal to the VP of HR, but they must perform a comprehensive equity review of existing team salaries.',
            nextNodeId: 'node-marcus-review-route',
            scoreFeedback: 'Professional escalation path. Auditing existing salaries before adjusting bands is standard corporate governance.',
            points: 15
          }
        ]
      },
      'node-marcus-bonus-solution': {
        id: 'node-marcus-bonus-solution',
        botMessage: 'Hmm, a signing bonus of $20k is a good idea. That brings them to $185k for the first year, which buys us time. They also mentioned wanting a remote-first contract. Can we offer extra work-from-home benefits to offset the base gap?',
        options: [
          {
            text: 'Yes! Remote flexibility and home office stipends are excellent non-monetary levers. Write up this proposal.',
            nextNodeId: 'node-marcus-success',
            scoreFeedback: 'Excellent! Non-monetary perks are powerful levers in recruitment compensation strategy.',
            points: 25
          },
          {
            text: 'No, remote work is restricted. They must come to the office like everyone else.',
            nextNodeId: 'node-marcus-rigid-failure',
            scoreFeedback: 'Refusing non-cost perks in a tight market can kill deals. Empathy and flexibility are required in compensation design.',
            points: 10
          }
        ]
      },
      'node-marcus-inequity': {
        id: 'node-marcus-inequity',
        botMessage: 'Great! We will draft the offer. Wait, if the other Senior engineers find out this person is making $185k when they are capped at $160k, are you going to handle the backlash?',
        options: [
          {
            text: 'Actually, you\'re right. Let\'s pause and propose a $165k base + signing bonus structure instead.',
            nextNodeId: 'node-marcus-bonus-solution',
            scoreFeedback: 'Wise correction. Recognizing pay compression/equity issues in time saves companies from mass turnovers.',
            points: 20
          },
          {
            text: 'Tell him salaries are confidential, and employees shouldn\'t be discussing pay.',
            nextNodeId: 'node-marcus-confidential-failure',
            scoreFeedback: 'Legally and culturally poor. Under the National Labor Relations Act (NLRA), employees have a protected right to discuss pay. Suppressing this is unlawful.',
            points: 2
          }
        ]
      },
      'node-marcus-review-route': {
        id: 'node-marcus-review-route',
        botMessage: 'An equity review will take three weeks! We will lose the candidate. Is there no faster way to expedite this?',
        options: [
          {
            text: 'Offer to run a rapid 48-hour comparison of key engineering staff, and check if we can secure VP signing authority.',
            nextNodeId: 'node-marcus-bonus-solution',
            scoreFeedback: 'Highly agile response. Fast-tracking operations checks shows HR is a business partner, not a roadblock.',
            points: 20
          }
        ]
      },
      'node-marcus-success': {
        id: 'node-marcus-success',
        botMessage: 'This package works. They accepted a $165k base + $20k sign-on bonus + remote stipend. We saved our base salary equity and hired the engineer. Excellent job!',
        options: []
      },
      'node-marcus-rigid-failure': {
        id: 'node-marcus-rigid-failure',
        botMessage: 'The candidate rejected the offer because of our rigid onsite policy and salary ceiling. Marcus is furious. We still have a database risk.',
        options: []
      },
      'node-marcus-confidential-failure': {
        id: 'node-marcus-confidential-failure',
        botMessage: 'Marcus moves forward. Two weeks later, pay sheets are leaked. Two senior engineers resign in protest over pay inequity. Your department is under scrutiny.',
        options: []
      }
    }
  }
];
