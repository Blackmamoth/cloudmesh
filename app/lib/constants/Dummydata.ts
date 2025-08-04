// Helper function to generate random file size
const getRandomSize = (): number => {
    // Generate sizes between 1KB and 100MB
    return Math.floor(Math.random() * (100 * 1024 * 1024 - 1024)) + 1024;
  };
  
  // Helper function to generate random deletion date (within last 30 days)
  const getRandomDeletedDate = (): string => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    return pastDate.toISOString();
  };
  
  // Helper function to generate random modified date (before deletion)
  const getRandomModifiedDate = (deletedAt: string): string => {
    const deletedDate = new Date(deletedAt);
    const modifiedDate = new Date(deletedDate.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    return modifiedDate.toISOString();
  };

const users = [
        {
          name: "John Doe",
          email: "john.doe@example.com",
          avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user1",
        },
        {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user2",
        },
        {
          name: "Alex Johnson",
          email: "alex.johnson@example.com",
          avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user3",
        },
        {
          name: "Sarah Wilson",
          email: "sarah.wilson@example.com", 
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=user4",
  },
];

// Mock trash data
export const mockTrashItems = [
    {
      id: "trash-1",
      name: "Old Project Plan.docx",
      type: "document",
      size: getRandomSize(),
      provider: "Google Drive",
      owner: users[0],
      modifiedAt: getRandomModifiedDate("2024-01-15T10:30:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[0],
      originalPath: "/Projects/2023/Q4",
    },
    {
      id: "trash-2",
      name: "Draft Budget.xlsx",
      type: "spreadsheet",
      size: getRandomSize(),
      provider: "Google Drive",
      owner: users[1],
      modifiedAt: getRandomModifiedDate("2024-01-14T15:20:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[1],
      originalPath: "/Finance/Drafts",
    },
    {
      id: "trash-3",
      name: "Vacation Photos.zip",
      type: "other",
      size: getRandomSize(),
      provider: "Dropbox",
      owner: users[2],
      modifiedAt: getRandomModifiedDate("2024-01-13T09:15:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[2],
      originalPath: "/Personal/Photos/2023",
    },
    {
      id: "trash-4",
      name: "Outdated Presentation.pptx",
      type: "presentation",
      size: getRandomSize(),
      provider: "Google Drive",
      owner: users[0],
      modifiedAt: getRandomModifiedDate("2024-01-12T14:45:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[3],
      originalPath: "/Presentations/Archive",
    },
    {
      id: "trash-5",
      name: "Temporary Report.pdf",
      type: "pdf",
      size: getRandomSize(),
      provider: "Dropbox",
      owner: users[1],
      modifiedAt: getRandomModifiedDate("2024-01-11T11:30:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[1],
      originalPath: "/Reports/Temp",
    },
    {
      id: "trash-6",
      name: "Screenshot 2023.png",
      type: "image",
      size: getRandomSize(),
      provider: "Dropbox",
      owner: users[2],
      modifiedAt: getRandomModifiedDate("2024-01-10T16:20:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[2],
      originalPath: "/Screenshots",
    },
    {
      id: "trash-7",
      name: "Meeting Notes Draft.docx",
      type: "document",
      size: getRandomSize(),
      provider: "Google Drive",
      owner: users[3],
      modifiedAt: getRandomModifiedDate("2024-01-09T13:10:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[0],
      originalPath: "/Meetings/2023/December",
    },
    {
      id: "trash-8",
      name: "Test Data.xlsx",
      type: "spreadsheet",
      size: getRandomSize(),
      provider: "Google Drive",
      owner: users[1],
      modifiedAt: getRandomModifiedDate("2024-01-08T08:45:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[1],
      originalPath: "/Development/Testing",
    },
    {
      id: "trash-9",
      name: "Logo Draft v1.jpg",
      type: "image",
      size: getRandomSize(),
      provider: "Dropbox",
      owner: users[2],
      modifiedAt: getRandomModifiedDate("2024-01-07T12:25:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[3],
      originalPath: "/Design/Logos/Drafts",
    },
    {
      id: "trash-10",
      name: "Contract Template.pdf",
      type: "pdf",
      size: getRandomSize(),
      provider: "Google Drive",
      owner: users[0],
      modifiedAt: getRandomModifiedDate("2024-01-06T17:55:00Z"),
                deletedAt: getRandomDeletedDate(),
      deletedBy: users[0],
      originalPath: "/Legal/Templates",
    },
    {
      id: "trash-11",
      name: "Backup Config.txt",
      type: "other",
      size: getRandomSize(),
      provider: "Dropbox",
      owner: users[3],
      modifiedAt: getRandomModifiedDate("2024-01-05T10:15:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[3],
      originalPath: "/Config/Backup",
    },
    {
      id: "trash-12",
      name: "Survey Results.xlsx",
      type: "spreadsheet",
      size: getRandomSize(),
      provider: "Google Drive",
      owner: users[1],
      modifiedAt: getRandomModifiedDate("2024-01-04T14:30:00Z"),
      deletedAt: getRandomDeletedDate(),
      deletedBy: users[2],
      originalPath: "/Research/Surveys/2023",
    },
  ]; 