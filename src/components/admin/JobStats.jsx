import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Briefcase, Trash2, Clock, DollarSign, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const JobsStats = ({ jobsStats, fetchJobsStats }) => {
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('This will permanently delete the job and all its applications. Continue?')) {
          return;
        }
      
        try {
          const response = await axios.delete(
            `http://localhost:5001/api/jobs/${jobId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              }
            }
          );
      
          toast.success(response.data.message);
          fetchJobsStats(); // Refresh the job list
        } catch (error) {
          console.error('Delete failed:', error.response?.data || error.message);
          toast.error(error.response?.data?.message || 'Failed to delete job');
        }
      };

  // Prepare data for the chart
  const chartData = {
    labels: jobsStats.map(job => job.title),
    datasets: [
      {
        label: 'Total Applicants',
        data: jobsStats.map(job => job.applicationCount),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1
      },
      {
        label: 'Selected',
        data: jobsStats.map(job => job.statusCounts.selected),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      },
      {
        label: 'Rejected',
        data: jobsStats.map(job => job.statusCounts.rejected),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Applicants per Job'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear'
      },
      x: {
        type: 'category'
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Chart Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Jobs Statistics</h2>
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Jobs List Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">All Job Postings</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Applicants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobsStats.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{job.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-indigo-600" />
                      <span className="text-sm text-gray-500 capitalize">{job.jobType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{job.role || 'Not specified'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.applicationCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Applied: {job.statusCounts.applied}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Interview: {job.statusCounts.interviewing}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Selected: {job.statusCounts.selected}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="text-red-600 hover:text-red-900 flex items-center"
                      title="Delete Job"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="ml-1">Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobsStats;