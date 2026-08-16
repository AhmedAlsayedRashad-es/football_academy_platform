// Learning content for each coaching license level

export interface LessonModule {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  duration: string; // e.g., "15 min read"
  keyPoints: string[];
  keyPointsAr: string[];
}

export interface CourseLearningContent {
  level: string;
  modules: LessonModule[];
}

export const learningContent: Record<string, CourseLearningContent> = {
  grassroots: {
    level: 'grassroots',
    modules: [
      {
        id: 'child-development',
        title: 'Child Development in Football',
        titleAr: 'تطوير الطفل في كرة القدم',
        duration: '20 min read',
        content: `# Child Development in Football

## Understanding Youth Development

Coaching young players (ages 4-12) requires a deep understanding of child development principles. At this age, children are developing fundamental movement skills, social skills, and cognitive abilities that will form the foundation of their football journey.

### Physical Development

Children at grassroots level are still developing their motor skills and coordination. Training sessions should focus on:

- **Fundamental Movement Skills**: Running, jumping, hopping, skipping, and balancing
- **Ball Manipulation**: Dribbling, passing, and shooting with both feet
- **Spatial Awareness**: Understanding positioning and movement in space
- **Coordination**: Hand-eye and foot-eye coordination development

### Cognitive Development

Young players are learning to process information and make decisions. Coaches should:

- Use simple, clear instructions with visual demonstrations
- Break down complex skills into manageable steps
- Allow time for players to think and problem-solve
- Create game-like situations that encourage decision-making

### Social and Emotional Development

Football provides excellent opportunities for social learning:

- **Teamwork**: Learning to cooperate and communicate with teammates
- **Respect**: Understanding rules, referees, and opponents
- **Resilience**: Dealing with mistakes and setbacks positively
- **Confidence**: Building self-esteem through skill mastery and encouragement

### Best Practices

1. **Keep it Fun**: Use games and play-based activities
2. **Positive Reinforcement**: Praise effort and improvement, not just results
3. **Age-Appropriate**: Match activities to developmental stage
4. **Inclusive**: Ensure all players get equal playing time and attention
5. **Safety First**: Proper warm-ups, equipment, and supervision

### Common Mistakes to Avoid

- Overemphasizing winning at young ages
- Using adult training methods with children
- Negative criticism or shouting
- Comparing players to each other
- Specializing too early in one position

### Creating Effective Training Sessions

A typical grassroots session (60-75 minutes) should include:

1. **Warm-up (10 min)**: Fun games with ball familiarization
2. **Technical Practice (15 min)**: Focused skill development
3. **Small-Sided Games (20 min)**: 3v3 or 4v4 games
4. **Match Play (15 min)**: Larger games applying skills
5. **Cool-down (5 min)**: Stretching and reflection

Remember: At grassroots level, the goal is to develop a love for the game, fundamental skills, and positive attitudes toward sport and physical activity.`,
        contentAr: 'محتوى باللغة العربية سيتم إضافته قريباً',
        keyPoints: [
          'Focus on fundamental movement skills and coordination',
          'Use age-appropriate teaching methods and activities',
          'Emphasize fun, inclusion, and positive reinforcement',
          'Develop social skills through team activities',
          'Avoid early specialization and overemphasis on winning'
        ],
        keyPointsAr: [
          'التركيز على المهارات الحركية الأساسية والتنسيق',
          'استخدام طرق تدريس مناسبة للعمر',
          'التأكيد على المرح والشمولية والتعزيز الإيجابي',
          'تطوير المهارات الاجتماعية من خلال الأنشطة الجماعية',
          'تجنب التخصص المبكر والتركيز المفرط على الفوز'
        ]
      },
      {
        id: 'basic-skills',
        title: 'Teaching Basic Football Skills',
        titleAr: 'تعليم مهارات كرة القدم الأساسية',
        duration: '25 min read',
        content: `# Teaching Basic Football Skills

## The Foundation of Football Development

Mastering basic skills is essential for young players. As a grassroots coach, your role is to introduce these skills in a fun, engaging way that builds confidence and competence.

### Dribbling

Dribbling is the foundation of ball control and individual creativity.

**Teaching Progression:**
1. **Ball Familiarization**: Let players explore touching the ball with different parts of their feet
2. **Walking with the Ball**: Gentle touches while moving slowly
3. **Jogging with the Ball**: Increasing speed while maintaining control
4. **Changing Direction**: Using inside and outside of feet to turn
5. **Dribbling Under Pressure**: Adding defenders gradually

**Key Coaching Points:**
- Keep the ball close (within playing distance)
- Use small, frequent touches
- Keep head up to see the field
- Use both feet
- Change speed and direction

**Fun Drills:**
- Red Light, Green Light (with ball)
- Sharks and Minnows
- Dribble Tag
- Cone Weaving Races

### Passing

Passing is the most used skill in football and essential for team play.

**Types of Passes to Teach:**
1. **Inside of Foot Pass**: Most accurate and common
2. **Outside of Foot Pass**: For quick direction changes
3. **Laces Pass**: For longer distances and power

**Teaching Progression:**
1. **Stationary Passing**: Partners 5-10 yards apart
2. **Passing While Moving**: One player moves, one stationary
3. **Passing on the Move**: Both players moving
4. **Passing with Pressure**: Adding defenders

**Key Coaching Points:**
- Plant foot beside the ball, pointing at target
- Strike through the center of the ball
- Follow through toward target
- Receive with first touch away from pressure
- Communication ("Man on!", "Turn!", "Pass!")

### Receiving/First Touch

A good first touch sets up the next action and is crucial for maintaining possession.

**Teaching Points:**
- **Cushion the Ball**: Relax foot on contact to absorb pace
- **Direct Touch**: First touch should move ball into space
- **Body Position**: Open body to see field and options
- **Different Surfaces**: Inside, outside, sole, thigh, chest

**Progression:**
1. Stationary receiving
2. Receiving while moving
3. Receiving with a defender behind
4. Receiving and turning in one motion

### Shooting

Scoring goals is the most exciting part of football for young players.

**Types of Shots:**
1. **Instep Drive**: Power shots with laces
2. **Inside Foot**: Accuracy and placement
3. **Volleys**: Striking ball in the air
4. **Headers**: Using forehead

**Key Coaching Points:**
- Plant foot beside ball
- Strike through center or bottom of ball
- Keep head down and over the ball
- Follow through toward goal
- Shoot early when opportunity arises

**Fun Shooting Games:**
- Target Practice (cones in goal)
- Knockout (players compete for goals)
- World Cup Tournament
- Beat the Keeper

### Defending

Even at grassroots level, basic defending principles should be introduced.

**Basic Defending Concepts:**
- **Jockeying**: Staying goal-side, forcing player wide
- **Tackling**: Timing and technique for winning the ball
- **Marking**: Staying close to opponent
- **Positioning**: Being between ball and goal

### Game-Based Learning

The best way to develop skills is through small-sided games:

- **3v3**: Lots of touches, decision-making
- **4v4**: Introduces basic tactics
- **5v5**: More positional awareness

**Benefits of Small-Sided Games:**
- More ball contacts per player
- More decisions to make
- More goals scored
- More fun and engagement
- Develops game intelligence

### Creating a Positive Learning Environment

- Demonstrate skills clearly
- Use positive language and encouragement
- Allow players to make mistakes
- Provide individual feedback
- Celebrate effort and improvement
- Make it competitive but fun

Remember: Skills develop over time with practice. Be patient, encouraging, and make every session enjoyable!`,
        contentAr: 'محتوى باللغة العربية سيتم إضافته قريباً',
        keyPoints: [
          'Teach dribbling, passing, receiving, and shooting progressively',
          'Use game-based learning through small-sided games',
          'Focus on technique before adding pressure or speed',
          'Provide clear demonstrations and positive feedback',
          'Make skill development fun and engaging'
        ],
        keyPointsAr: [
          'تعليم المراوغة والتمرير والاستقبال والتسديد بشكل تدريجي',
          'استخدام التعلم القائم على اللعب',
          'التركيز على التقنية قبل إضافة الضغط',
          'تقديم عروض توضيحية واضحة',
          'جعل تطوير المهارات ممتعاً'
        ]
      }
    ]
  },
  
  c_license: {
    level: 'c_license',
    modules: [
      {
        id: 'tactical-fundamentals',
        title: 'Tactical Fundamentals',
        titleAr: 'الأساسيات التكتيكية',
        duration: '30 min read',
        content: `# Tactical Fundamentals for C License Coaches

## Introduction to Football Tactics

At C License level, coaches begin to understand and implement basic tactical concepts. Tactics are the strategic decisions made to organize players and maximize team performance.

### The Four Phases of Play

Modern football is understood through four distinct phases:

#### 1. Attacking Phase (In Possession)
**Objective**: Create and convert goal-scoring opportunities

**Key Principles:**
- **Width**: Spread the field to create space
- **Depth**: Provide forward passing options
- **Support**: Offer passing angles and options
- **Penetration**: Move ball forward when possible
- **Mobility**: Movement to create space and confusion

**Attacking Patterns:**
- Building from the back
- Playing through midfield
- Wide play and crossing
- Combination play (1-2s, overlaps)
- Individual creativity

#### 2. Defensive Phase (Out of Possession)
**Objective**: Prevent opponent from scoring and regain possession

**Key Principles:**
- **Pressure**: Close down ball carrier quickly
- **Cover**: Support the pressuring player
- **Balance**: Maintain defensive shape
- **Compactness**: Reduce space between players
- **Concentration**: Stay focused and organized

**Defensive Strategies:**
- High press
- Mid-block
- Low block
- Man-marking vs. zonal marking
- Offside trap

#### 3. Transition to Attack (Winning the Ball)
**Objective**: Quickly exploit defensive disorganization

**Key Actions:**
- **Speed**: Move ball forward quickly
- **Numbers**: Get players forward fast
- **Decision-making**: Recognize when to counter vs. build
- **Quality**: Execute passes and runs accurately

#### 4. Transition to Defense (Losing the Ball)
**Objective**: Prevent opponent's counter-attack

**Key Actions:**
- **Immediate Pressure**: Press ball carrier instantly
- **Recovery Runs**: Sprint back into defensive positions
- **Delay**: Slow down opponent's attack
- **Organization**: Quickly reform defensive shape

### Basic Formations

#### 4-4-2 Formation
**Strengths:**
- Balanced and easy to understand
- Good defensive coverage
- Clear partnerships (striker duo, wide players)

**Weaknesses:**
- Can be outnumbered in midfield
- Less creative freedom
- Predictable structure

**Best For:** Youth teams, developing tactical understanding

#### 4-3-3 Formation
**Strengths:**
- Width in attack
- Midfield control with three players
- High pressing capability
- Attacking flexibility

**Weaknesses:**
- Requires fit fullbacks
- Can be exposed on counter-attacks
- Needs intelligent midfielders

**Best For:** Possession-based, attacking teams

#### 4-2-3-1 Formation
**Strengths:**
- Defensive stability with two holding midfielders
- Creative freedom for attacking midfielder
- Flexible attacking options

**Weaknesses:**
- Lone striker can be isolated
- Requires versatile attacking midfielders
- Can lack width

**Best For:** Teams with a strong playmaker

### Principles of Play

#### Attacking Principles
1. **Maintain Possession**: Keep the ball to control the game
2. **Create Space**: Movement to open passing lanes
3. **Exploit Space**: Attack where opponent is weak
4. **Vary Attack**: Use different methods (wide, through middle, long, short)
5. **Finish**: Take shots when opportunities arise

#### Defensive Principles
1. **Immediate Pressure**: Challenge ball carrier
2. **Deny Penetration**: Prevent forward passes
3. **Defensive Shape**: Maintain organization
4. **Win the Ball**: Tackle and intercept
5. **Protect Goal**: Priority is preventing goals

### Teaching Tactics to Players

**Progressive Approach:**
1. **Understand**: Explain the concept
2. **Demonstrate**: Show how it works
3. **Practice**: Drill the pattern
4. **Apply**: Use in game situations
5. **Review**: Analyze and improve

**Effective Methods:**
- Whiteboard sessions
- Video analysis
- Shadow play (no opposition)
- Opposed practice
- Small-sided games
- Full match scenarios

### Set Pieces

Set pieces account for 30-40% of goals at all levels.

**Corner Kicks:**
- Near post runs
- Far post delivery
- Short corners
- Defensive organization

**Free Kicks:**
- Direct shots
- Crossing opportunities
- Rehearsed routines
- Wall organization (defending)

**Throw-Ins:**
- Quick restarts
- Long throws
- Movement patterns

### Match Analysis

**Pre-Match:**
- Analyze opponent's strengths and weaknesses
- Plan tactical approach
- Prepare players mentally

**During Match:**
- Observe patterns and trends
- Make tactical adjustments
- Communicate with players

**Post-Match:**
- Review performance
- Identify areas for improvement
- Plan future training

### Developing Game Intelligence

Help players understand:
- When to pass vs. dribble
- When to shoot vs. pass
- When to press vs. hold position
- When to play safe vs. take risks

**Questions to Ask Players:**
- "What do you see?"
- "What are your options?"
- "Why did you make that decision?"
- "What could you do differently?"

### Conclusion

Tactical understanding develops over time. Start with simple concepts, practice them consistently, and gradually add complexity as players demonstrate understanding. The best tactics are those your players can execute effectively!`,
        contentAr: 'محتوى باللغة العربية سيتم إضافته قريباً',
        keyPoints: [
          'Understand the four phases of play: attacking, defending, and both transitions',
          'Learn basic formations (4-4-2, 4-3-3, 4-2-3-1) and their strengths/weaknesses',
          'Apply principles of play in attacking and defending situations',
          'Develop set-piece strategies for corners, free kicks, and throw-ins',
          'Teach players game intelligence through questioning and analysis'
        ],
        keyPointsAr: [
          'فهم المراحل الأربع للعب',
          'تعلم التشكيلات الأساسية ونقاط قوتها وضعفها',
          'تطبيق مبادئ اللعب في الهجوم والدفاع',
          'تطوير استراتيجيات الركلات الثابتة',
          'تعليم اللاعبين ذكاء اللعبة'
        ]
      }
    ]
  }
};
