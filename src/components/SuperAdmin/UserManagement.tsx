"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  Users,
  Trash2,
  Edit,
  Eye,
  Lock,
  CheckCircle,
  XCircle,
  GraduationCap,
} from "lucide-react";
import { set } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  ph_no: string;
  name: string;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  createdAt: string;
}

const mockUsers: User[] = [
  {
    id: "cm8qb4ugr000stkxoi72m2n23",
    ph_no: "9876543210",
    name: "John Doe",
    email: "john@example.com",
    image: null,
    role: "USER",
    createdAt: "2023-01-15T00:00:00.000Z",
  },
  {
    id: "cm8qb4ugr000stkxoi72m2n24",
    ph_no: "9876543211",
    name: "Jane Smith",
    email: "jane@example.com",
    image: null,
    role: "ADMIN",
    createdAt: "2022-11-05T00:00:00.000Z",
  },
  {
    id: "cm8qb4ugr000stkxoi72m2n25",
    ph_no: "9876543212",
    name: "Robert Johnson",
    email: "robert@example.com",
    image: null,
    role: "ADMIN",
    createdAt: "2022-08-12T00:00:00.000Z",
  },
  {
    id: "cm8qb4ugr000stkxoi72m2n26",
    ph_no: "9876543213",
    name: "Emily Davis",
    email: "emily@example.com",
    image: null,
    role: "USER",
    createdAt: "2023-02-28T00:00:00.000Z",
  },
  {
    id: "cm8qb4ugr000stkxoi72m2n27",
    ph_no: "9876543214",
    name: "Michael Wilson",
    email: "michael@example.com",
    image: null,
    role: "SUPERADMIN",
    createdAt: "2022-06-15T00:00:00.000Z",
  },
];

export default function UserManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<
    (typeof mockUsers)[0] | null
  >(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "USER",
    phone: "",
    password: "",
    confirmPassword: "",
    sendInvite: true,
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would fetch from your API
      const response = await fetch("/api/superadmin/users");
      const data = await response.json();
      // console.log("Fetched users:", data)
      // Using mock data for demonstration
      setUsers(data.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query and filters
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    // const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesRole;
  });

  // const handleCreateUser = () => {
  //   // Validate form
  //   if (!newUser.name || !newUser.email || !newUser.role) {
  //     alert("Please fill in all required fields")
  //     return
  //   }

  //   if (newUser.password !== newUser.confirmPassword) {
  //     alert("Passwords do not match")
  //     return
  //   }

  //   // In a real app, you would call your API to create the user
  //   // const response = await fetch('/api/users', {
  //   //   method: 'POST',
  //   //   headers: { 'Content-Type': 'application/json' },
  //   //   body: JSON.stringify(newUser)
  //   // });

  //   // Simulate creating a new user
  //   const createdUser: User = {
  //     id: (users.length + 1).toString(),
  //     name: newUser.name,
  //     email: newUser.email,
  //     role: newUser.role.toUpperCase() as User["role"],
  //     ph_no: newUser.phone || "-",
  //     image: null,
  //     createdAt: new Date().toISOString(),
  //   }

  //   setUsers([...users, createdUser])
  //   setIsCreateDialogOpen(false)
  //   setNewUser({
  //     name: "",
  //     email: "",
  //     role: "USER",
  //     phone: "",
  //     password: "",
  //     confirmPassword: "",
  //     sendInvite: true,
  //   })
  // }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    // In a real app, you would call your API to update the user role
    const response = await fetch(`/api/superadmin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, targetUserRole: newRole }),
    });

    // Update user role in the state
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole as User["role"] } : user
      )
    );

    setIsEditDialogOpen(false);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      //console.log("Delete response:", data);

      if (!response.ok) {
        alert(data.message || "Something went wrong");
      } else {
        alert("User deleted successfully");
        fetchUsers(); // reload user list
      }
    } catch (err) {
      alert("Error deleting user");
      console.error(err);
    }

    setIsDeleteDialogOpen(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-orange-500" />;
      case "USER":
      default:
        return <User className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for your platform.
          </p>

          

        </div>
        {/* <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button> */}

         <button className=" flex flex-wrap gap-3 justify-center items-center bg-green-600 px-4 py-2 rounded md text-white !poppinsmd font-bold right-5 " onClick={()=>router.push('/superadmin/enrollments')}>View Enrollments<GraduationCap/> </button>
         
      </div>



      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">SuperAdmin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {/* <TableHead>Status</TableHead> */}
                <TableHead>Join Date</TableHead>
                {/* <TableHead>Last Login</TableHead> */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No users found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </TableCell>
                    {/* <TableCell>{getStatusBadge(user.status)}</TableCell> */}
                    <TableCell>{user.createdAt}</TableCell>
                    {/* <TableCell>{user.lastLogin}</TableCell> */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {/* <DropdownMenuSeparator /> */}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      {selectedUser && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <DialogDescription>View and change their role.</DialogDescription>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={selectedUser.image || undefined}
                      alt={selectedUser.name}
                    />
                    <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(selectedUser.role)}
                    <span className="capitalize">{selectedUser.role}</span>
                  </div>
                </div>

                {/* <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedUser.status)}
                </div> */}

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Join Date
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.createdAt}</span>
                  </div>
                </div>

                {/* <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Last Login</span>
                  <span>{selectedUser.lastLogin}</span>
                </div> */}

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.ph_no}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsEditDialogOpen(true);
                }}
              >
                Edit Role
              </Button>
              <Button
                variant={"destructive"}
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Role Dialog */}
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser.name}. This will change their
                permissions on the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select
                  defaultValue={selectedUser.role}
                  onValueChange={(value) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: value as User["role"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleUpdateUserRole(selectedUser.id, selectedUser.role);
                  setIsEditDialogOpen(false);
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Dialog */}
      {selectedUser && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user account for{" "}
                {selectedUser.name} ({selectedUser.email}). This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDeleteUser(selectedUser.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
