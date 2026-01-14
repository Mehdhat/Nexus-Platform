import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Filter, Search, PlusCircle, Wallet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { entrepreneurs } from '../../data/users';
import { getRequestsFromInvestor } from '../../data/collaborationRequests';
import { getWalletBalance } from '../../data/payments';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  
  if (!user) return null;
  
  // Get collaboration requests sent by this investor
  const sentRequests = getRequestsFromInvestor(user.id);
  
  // Filter entrepreneurs based on search and industry filters
  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.pitchSummary.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Industry filter
    const matchesIndustry = selectedIndustries.length === 0 || 
      selectedIndustries.includes(entrepreneur.industry);
    
    return matchesSearch && matchesIndustry;
  });
  
  // Get unique industries for filter
  const industries = Array.from(new Set(entrepreneurs.map(e => e.industry)));

  const walletBalance = getWalletBalance(user.id);
  
  // Toggle industry selection
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prevSelected => 
      prevSelected.includes(industry)
        ? prevSelected.filter(i => i !== industry)
        : [...prevSelected, industry]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        
        <Link to="/entrepreneurs">
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            View All Startups
          </Button>
        </Link>
      </div>
      
      {/* Filters and search */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>

        <div className="hidden md:flex items-center gap-2 flex-nowrap">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by</span>
        </div>

        <div className="hidden md:block max-w-[38%]">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            {industries.map(industry => (
              <button
                key={industry}
                type="button"
                className="cursor-pointer flex-shrink-0"
                onClick={() => toggleIndustry(industry)}
              >
                <Badge
                  variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                  className="cursor-pointer"
                >
                  {industry}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Filter size={18} className="text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">Filter</span>
          {industries.map(industry => (
            <button
              key={industry}
              type="button"
              className="cursor-pointer flex-shrink-0"
              onClick={() => toggleIndustry(industry)}
            >
              <Badge
                variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                className="cursor-pointer"
              >
                {industry}
              </Badge>
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Wallet size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Wallet Balance</p>
                <h3 className="text-xl font-semibold text-primary-900">${walletBalance.toFixed(2)}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {sentRequests.filter(req => req.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="md:hidden">
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/calendar" className="w-full">
              <Button variant="outline" fullWidth>
                Calendar
              </Button>
            </Link>
            <Link to="/payments" className="w-full">
              <Button variant="outline" fullWidth>
                Payments
              </Button>
            </Link>
            <Link to="/documents" className="w-full">
              <Button variant="outline" fullWidth>
                Documents
              </Button>
            </Link>
            <Link to="/video-call" className="w-full">
              <Button variant="outline" fullWidth>
                Video Call
              </Button>
            </Link>
            <Link to="/entrepreneurs" className="w-full col-span-2">
              <Button fullWidth>
                Find Startups
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
      
      {/* Entrepreneurs grid */}
      <div>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
          </CardHeader>
          
          <CardBody>
            {filteredEntrepreneurs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntrepreneurs.map(entrepreneur => (
                  <EntrepreneurCard
                    key={entrepreneur.id}
                    entrepreneur={entrepreneur}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No startups match your filters</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustries([]);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};