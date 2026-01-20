"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, BookOpen, DollarSign, Activity, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function DashboardOverview() {

  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  })

  const [revenueData, setRevenueData] = useState<{ name: string; revenue: number }[]>([])
  const [userRoleData, setUserRoleData] = useState<{ name: string; value: number }[]>([])
  const [courseEnrollmentData, setCourseEnrollmentData] = useState<{ name: string; enrollments: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  //   useEffect(() => {
  //     // Simulate API call to fetch dashboard data
  //     const fetchDashboardData = async () => {
  //       try {
  //         setIsLoading(true)
  //         // In a real app, you would fetch this data from your API
  //         // const response = await fetch('/api/superadmin/dashboard');
  //         // const data = await response.json();

  //         // Simulated data
  //         // setTimeout(() => {
  //         //   setStats({
  //         //     totalUsers: 1250,
  //         //     totalCourses: 45,
  //         //     totalRevenue: 125000,
  //         //     activeSubscriptions: 850,
  //         //   })
  //         const response = await fetch("/api/superadmin/dashboard");
  //         const data = await response.json();

  //         setStats({
  //           totalUsers: data.totalUsers,
  //           totalCourses: data.totalCourses,
  //           totalRevenue: data.totalRevenue,
  //           activeSubscriptions: data.activeSubscriptions,
  //         });

  //         // You can still use mock data for charts for now
  //         setRevenueData([...]);
  //         setUserRoleData([...]);
  //         setCourseEnrollmentData([...]);

  //         setIsLoading(false);


  //         setRevenueData([
  //           { name: "Jan", revenue: 12000 },
  //           { name: "Feb", revenue: 15000 },
  //           { name: "Mar", revenue: 18000 },
  //           { name: "Apr", revenue: 16000 },
  //           { name: "May", revenue: 21000 },
  //           { name: "Jun", revenue: 19000 },
  //           { name: "Jul", revenue: 24000 },
  //         ])

  //         setUserRoleData([
  //           { name: "Students", value: 950 },
  //           { name: "Instructors", value: 45 },
  //           { name: "Admins", value: 15 },
  //           { name: "SuperAdmins", value: 3 },
  //         ])

  //         setCourseEnrollmentData([
  //           { name: "Data Science", enrollments: 350 },
  //           { name: "Web Development", enrollments: 280 },
  //           { name: "Machine Learning", enrollments: 200 },
  //           { name: "Mobile App Dev", enrollments: 180 },
  //           { name: "Cloud Computing", enrollments: 150 },
  //         ])

  //         setIsLoading(false)
  //       }, 1000)
  // } catch (error) {
  //   console.error("Error fetching dashboard data:", error)
  //   setIsLoading(false)
  // }
  //     }

  // fetchDashboardData()
  //   }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/superadmin/dashboard");
        const data = await response.json();

        setStats({
          totalUsers: data.totalUsers,
          totalCourses: data.totalCourses,
          totalRevenue: data.totalRevenue,
          activeSubscriptions: data.activeSubscriptions,
        });

        setRevenueData([
          { name: "Jan", revenue: 12000 },
          { name: "Feb", revenue: 15000 },
          { name: "Mar", revenue: 18000 },
          { name: "Apr", revenue: 16000 },
          { name: "May", revenue: 21000 },
          { name: "Jun", revenue: 19000 },
          { name: "Jul", revenue: 24000 },
        ]);

        setUserRoleData([
          { name: "Students", value: 950 },
          { name: "Instructors", value: 45 },
          { name: "Admins", value: 15 },
          { name: "SuperAdmins", value: 3 },
        ]);

        setCourseEnrollmentData([
          { name: "Data Science", enrollments: 350 },
          { name: "Web Development", enrollments: 280 },
          { name: "Machine Learning", enrollments: 200 },
          { name: "Mobile App Dev", enrollments: 180 },
          { name: "Cloud Computing", enrollments: 150 },
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your education platform&apos;s performance and metrics.</p>
        
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">+3 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : `₹${stats.totalRevenue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">User Distribution</TabsTrigger>
          <TabsTrigger value="courses">Course Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the current year</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading chart data...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Breakdown of users by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading chart data...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Users"]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Course Enrollments</CardTitle>
              <CardDescription>Most popular courses by enrollment</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading chart data...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseEnrollmentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip formatter={(value) => [value, "Enrollments"]} />
                      <Bar dataKey="enrollments" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and events on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading recent activity...</div>
            ) : (
              <>
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New user registered</p>
                    <p className="text-sm text-muted-foreground">John Doe joined as a student</p>
                  </div>
                  <div className="text-sm text-muted-foreground">2 hours ago</div>
                </div>

                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New course published</p>
                    <p className="text-sm text-muted-foreground">Advanced Machine Learning Techniques</p>
                  </div>
                  <div className="text-sm text-muted-foreground">5 hours ago</div>
                </div>

                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New subscription purchase</p>
                    <p className="text-sm text-muted-foreground">Premium Plan - Annual subscription</p>
                  </div>
                  <div className="text-sm text-muted-foreground">1 day ago</div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Course completion</p>
                    <p className="text-sm text-muted-foreground">Sarah Johnson completed Web Development Bootcamp</p>
                  </div>
                  <div className="text-sm text-muted-foreground">2 days ago</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

