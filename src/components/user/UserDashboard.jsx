import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Briefcase,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  FileSearch,
  ChevronLeft,
  Home,
  User,
} from "lucide-react";

const UserDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/applications/user",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setApplications(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "selected":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "interviewing":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "underConsideration":
        return <FileSearch className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    return status
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-md">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">JobPortal</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/jobs"
                className="flex items-center p-2 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
              >
                <ChevronLeft className="w-5 h-5 mr-3" />
                Back to Jobs
              </Link>
            </li>
            <li>
              <Link
                to="/user-dashboard"
                className="flex items-center p-2 text-white bg-indigo-600 rounded-lg"
              >
                <User className="w-5 h-5 mr-3" />
                My Applications
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex items-center p-2 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Home className="w-5 h-5 mr-3" />
                Home
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Applications</h1>
          <p className="text-gray-600 mt-2">
            Track the status of all your job applications
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No applications yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't applied to any jobs yet. Find your dream job and apply
              today!
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div
                key={application._id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {application.job.title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Applied on{" "}
                        {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(application.status)}
                      <span className="ml-2 font-medium">
                        {getStatusText(application.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        ${application.job.salary.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {application.job.experienceRequired >= 12
                          ? `${Math.floor(
                              application.job.experienceRequired / 12
                            )} years`
                          : `${application.job.experienceRequired} months`}{" "}
                        experience
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-700 capitalize">
                        {application.job.jobType
                          .replace(/([A-Z])/g, " $1")
                          .trim()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Application Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Skill Match</p>
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{
                                width: `${application.skillMatch}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {application.skillMatch}% match with required skills
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Experience Match
                        </p>
                        <p className="mt-1 text-gray-800">
                          {application.experienceMatch ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Meets requirements
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-yellow-600">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              Below requirements
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
