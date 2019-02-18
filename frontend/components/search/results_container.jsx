import React, {Component} from 'react';
import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom';
import queryString from 'query-string';
import _ from 'lodash';
import moment from 'moment';

import { updateFilter, setFilter } from '../../actions/filters';

import { queryListings } from '../../actions/listings'
import SearchResultsMap from './results_map';
import SearchResultsList from './results_list';

import Loading from '../misc/loading';


class SearchResultContainer extends Component {
  constructor(props) {
    super(props);
  }

  setFilterFromURL = () => {
    const { setFilter } = this.props;
    const query = queryString.parse(this.props.location.search)

    if(_.isEmpty(query)) return this.props.history.push('/');
    
    setFilter({
      lat: parseFloat(query.lat),
      lng: parseFloat(query.lng),
      start_date: query.start_date, 
      end_date: query.end_date, 
      max_guests: query.max_guests
    });
  }
 
  componentDidMount() {
    const { filter } = this.props;
    if(filter.bounds) {
      this.setFilterFromURL()
    }
  }

  componentDidUpdate(prevProps) {
    const { filter } = this.props;
    if(prevProps.location.search != this.props.location.search) {
      if(filter.bounds) {
        this.setFilterFromURL()
      }
    }
  }

  render() {
    const { listings, updateFilter, searching, filter } = this.props;

    const query = queryString.parse(this.props.location.search)

    const initMapLatLng = {
      lat: parseFloat(query.lat),
      lng: parseFloat(query.lng)
    }

    const resultsCount = listings.length;
    
    return (
      <>
        <section className="flush-content-container search-listings-container">
          <h3>{resultsCount ? `${resultsCount}+ home${resultsCount > 1 ? 's' : ''}` : 'No results were found for this search' }
          </h3>
          <SearchResultsList 
            listings={listings}
            searching={searching}
           />
          <SearchResultsMap 
            listings={listings}
            updateFilter={updateFilter}
            setFilter={setFilter}
            filter={filter}
            initMapLatLng={initMapLatLng}
          />
        </section>
      </>
    )
  }
}

const msp = state => ({
  searching: state.ui.searching,
  listings: Object.values(state.entities.listings),
  amenities: state.entities.amenities,
  home_types: state.entities.home_types,
  filter: state.filters
})

const mdp = dispatch => ({
  updateFilter: (filter,value) => dispatch(updateFilter(filter,value)),
  setFilter: (filter) => dispatch(setFilter(filter))
})

export default withRouter(connect(msp,mdp)(SearchResultContainer));